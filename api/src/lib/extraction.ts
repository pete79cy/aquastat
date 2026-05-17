/**
 * AI extraction service — sends a PDF to Claude and gets back structured JSON.
 *
 * Cost / speed optimizations:
 * - Two-tier model selection: Opus for proclamations (complex Greek reasoning),
 *   Haiku for results (tabular extraction, 15x cheaper, much faster)
 * - Streaming + finalMessage() to avoid HTTP timeouts on long calls
 * - Prompt caching on the static instructions block (~90% discount on repeats)
 * - Larger max_tokens for results (some PDFs have 100+ rows)
 *
 * Uses a forced tool call as the structured-output mechanism (stable across
 * SDK versions). PDF is sent as a base64 document content block.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getAnthropic } from "./anthropic.js";
import { readFileBase64, fileExists } from "./storage.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

// ─── Zod schemas for extracted data ────────────────────────────────────────

export const ProclamationSchema = z.object({
  competitions: z
    .array(
      z.object({
        name: z.string(),
        startDate: z.string().describe("ISO date YYYY-MM-DD"),
        endDate: z.string().describe("ISO date YYYY-MM-DD"),
        location: z.string().nullable(),
        venue: z.string().nullable(),
        poolType: z.enum(["25m", "50m"]).nullable(),
        declarationDeadline: z.string().nullable(),
      })
    )
    .describe("All competitions listed in the proclamation"),
  ageCategories: z
    .array(
      z.object({
        nameEl: z.string(),
        nameEn: z.string().nullable(),
        genderScope: z.enum(["male", "female", "any"]),
        birthYearFrom: z.number().int().nullable(),
        birthYearTo: z.number().int().nullable(),
      })
    )
    .describe("Age category definitions"),
  qualificationStandards: z
    .array(
      z.object({
        eventLabel: z.string(),
        distanceM: z.number().int(),
        stroke: z.enum(["freestyle", "backstroke", "breaststroke", "butterfly", "medley"]),
        categoryName: z.string(),
        gender: z.enum(["male", "female"]),
        timeMs: z.number().int(),
      })
    )
    .describe("Qualification time standards (times in integer milliseconds)"),
  notes: z.string().nullable(),
});

export type ProclamationExtraction = z.infer<typeof ProclamationSchema>;

export const ResultsSchema = z.object({
  competitionName: z.string().nullable(),
  competitionDate: z.string().nullable(),
  results: z.array(
    z.object({
      athleteName: z.string().describe("Full name as printed, e.g. 'Μαρίνος Πακκουτής'"),
      athleteRegistrationNumber: z
        .string()
        .nullable()
        .describe("ΚΟΕΚ registration number if printed before/with the athlete name — e.g. '8659' from '8659 Μαρίνος Πακκουτής'. Pure digits only, no spaces."),
      clubName: z.string().nullable(),
      eventLabel: z.string(),
      distanceM: z.number().int(),
      stroke: z.enum(["freestyle", "backstroke", "breaststroke", "butterfly", "medley"]),
      timeMs: z.number().int(),
      rank: z.number().int().nullable(),
      round: z.enum(["heat", "final", "direct_final"]).nullable(),
      gender: z.enum(["male", "female"]).nullable(),
    })
  ),
});

export type ResultsExtraction = z.infer<typeof ResultsSchema>;

// ─── JSON schemas (converted once at module load — saves CPU per request) ──
const proclamationJsonSchema = z.toJSONSchema(ProclamationSchema, { target: "draft-7" });
const resultsJsonSchema = z.toJSONSchema(ResultsSchema, { target: "draft-7" });

// ─── Prompts ───────────────────────────────────────────────────────────────

const PROCLAMATION_INSTRUCTIONS = `You are extracting structured data from a Cyprus swimming season proclamation document (typically Greek text).

Extract every competition, age category and qualification standard you can identify.

Conversion rules:
- ALL times must be integer MILLISECONDS. Examples:
  "26.50" → 26500
  "1:05.23" → 65230
  "15:44.90" → 944900
- Pool length: explicit "50μ"/"50m" → "50m", "25μ"/"25m" → "25m", otherwise null.
- Birth year ranges: if a category says "γεννηθέντες 2012" set both from and to to 2012;
  if "2007 και πριν" set from = null and to = 2007.
- categoryName in standards MUST exactly match a nameEl in ageCategories.

If a field is genuinely unknown, set it to null. Be exhaustive but accurate.

Call the save_extraction tool with the structured result.`;

const RESULTS_INSTRUCTIONS = `You are extracting individual swim results from a Cyprus swimming meet results PDF.

Skip relays — only individual events. For each result:
- Convert times to integer milliseconds (e.g., "1:05.23" → 65230).
- Infer gender from the event name if listed as Men's/Women's section.
- Skip empty rows, DSQ, DNF or DNS.

REGISTRATION NUMBERS (κρίσιμο για matching):
Cyprus swimming results commonly list each athlete as
  <registration_number> <athlete name> <club> <time>
Example: "8659  Μαρίνος Πακκουτής  ΝΟΛ  1:05.23"
The leading 3-5 digit number BEFORE the name is the athlete's ΚΟΕΚ registration
number (athleteRegistrationNumber). Extract it as digits-only string.
If a number is not clearly a registration number (e.g. it's a heat lane,
year of birth like 2012, or a rank), set athleteRegistrationNumber to null.
Registration numbers are usually 3-6 digits and appear immediately before
the athlete's name, not after.

Call the save_extraction tool with the structured result.`;

// ─── Helpers ───────────────────────────────────────────────────────────────

type ExtractionResult<T> = {
  data: T;
  confidencePercent: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  model: string;
}

async function callExtraction<T extends z.ZodType>({
  filepath,
  instructions,
  schema,
  jsonSchema,
  model,
  maxTokens,
}: {
  filepath: string;
  instructions: string;
  schema: T;
  jsonSchema: object;
  model: string;
  maxTokens: number;
}): Promise<{ data: z.infer<T>; usage: Anthropic.Usage; model: string }> {
  if (!fileExists(filepath)) throw new Error(`File not found: ${filepath}`);
  const client = getAnthropic();
  const pdfBase64 = readFileBase64(filepath);

  const tool: Anthropic.Tool = {
    name: "save_extraction",
    description: "Save the structured extraction result.",
    input_schema: jsonSchema as Anthropic.Tool["input_schema"],
  };

  // Streaming + finalMessage() avoids HTTP timeouts on long extractions.
  // Prompt-cache the instructions: identical across requests, gives ~90% discount.
  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    tools: [tool],
    tool_choice: { type: "tool", name: "save_extraction" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: instructions,
            cache_control: { type: "ephemeral" },
          },
        ],
      },
    ],
  });

  const response = await stream.finalMessage();

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Model did not call save_extraction tool");
  }

  const data = schema.parse(toolUse.input);
  return { data, usage: response.usage, model };
}

function pickModel(taskModel: string | undefined, fallback: string): string {
  return taskModel && taskModel.trim().length > 0 ? taskModel : fallback;
}

// ─── Public extraction APIs ────────────────────────────────────────────────

export async function extractProclamation(
  filepath: string
): Promise<ExtractionResult<ProclamationExtraction>> {
  const startTime = Date.now();
  const model = pickModel(env.ANTHROPIC_MODEL_PROCLAMATION, env.ANTHROPIC_MODEL);

  const { data, usage, model: usedModel } = await callExtraction({
    filepath,
    instructions: PROCLAMATION_INSTRUCTIONS,
    schema: ProclamationSchema,
    jsonSchema: proclamationJsonSchema,
    model,
    maxTokens: 32000,
  });

  const itemCount =
    data.competitions.length + data.ageCategories.length + data.qualificationStandards.length;
  const confidencePercent = itemCount >= 10 ? 92 : itemCount >= 5 ? 80 : 65;

  logger.info(
    {
      filepath,
      durationMs: Date.now() - startTime,
      itemCount,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
      model: usedModel,
    },
    "ai_extraction_proclamation_complete"
  );

  return {
    data,
    confidencePercent,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
    model: usedModel,
  };
}

export async function extractResults(
  filepath: string
): Promise<ExtractionResult<ResultsExtraction>> {
  const startTime = Date.now();
  const model = pickModel(env.ANTHROPIC_MODEL_RESULTS, "claude-haiku-4-5");

  const { data, usage, model: usedModel } = await callExtraction({
    filepath,
    instructions: RESULTS_INSTRUCTIONS,
    schema: ResultsSchema,
    jsonSchema: resultsJsonSchema,
    model,
    maxTokens: 32000,
  });

  const confidencePercent =
    data.results.length >= 20 ? 90 : data.results.length >= 5 ? 78 : 60;

  logger.info(
    {
      filepath,
      durationMs: Date.now() - startTime,
      resultCount: data.results.length,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
      model: usedModel,
    },
    "ai_extraction_results_complete"
  );

  return {
    data,
    confidencePercent,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
    model: usedModel,
  };
}
