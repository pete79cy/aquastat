/**
 * AI extraction service — sends a PDF to Claude and gets back structured JSON.
 *
 * Uses claude-opus-4-6 with a forced tool call as the structured-output
 * mechanism (more stable across SDK versions than messages.parse). PDF is sent
 * as a base64 document content block. Returns typed data; caller persists.
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
      athleteName: z.string(),
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

// ─── JSON schemas (converted at module load — Anthropic API expects JSON Schema)
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

Call the save_extraction tool with the structured result.`;

// ─── Helpers ───────────────────────────────────────────────────────────────

type ExtractionResult<T> = {
  data: T;
  confidencePercent: number;
  inputTokens: number;
  outputTokens: number;
};

async function callExtraction<T extends z.ZodType>({
  filepath,
  instructions,
  schema,
  jsonSchema,
}: {
  filepath: string;
  instructions: string;
  schema: T;
  jsonSchema: object;
}): Promise<{ data: z.infer<T>; usage: Anthropic.Usage }> {
  if (!fileExists(filepath)) throw new Error(`File not found: ${filepath}`);
  const client = getAnthropic();
  const pdfBase64 = readFileBase64(filepath);

  const tool: Anthropic.Tool = {
    name: "save_extraction",
    description: "Save the structured extraction result.",
    input_schema: jsonSchema as Anthropic.Tool["input_schema"],
  };

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 16000,
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
          { type: "text", text: instructions },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Model did not call save_extraction tool");
  }

  const data = schema.parse(toolUse.input);
  return { data, usage: response.usage };
}

// ─── Public extraction APIs ────────────────────────────────────────────────

export async function extractProclamation(
  filepath: string
): Promise<ExtractionResult<ProclamationExtraction>> {
  const startTime = Date.now();
  const { data, usage } = await callExtraction({
    filepath,
    instructions: PROCLAMATION_INSTRUCTIONS,
    schema: ProclamationSchema,
    jsonSchema: proclamationJsonSchema,
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
    },
    "ai_extraction_proclamation_complete"
  );

  return {
    data,
    confidencePercent,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
  };
}

export async function extractResults(
  filepath: string
): Promise<ExtractionResult<ResultsExtraction>> {
  const startTime = Date.now();
  const { data, usage } = await callExtraction({
    filepath,
    instructions: RESULTS_INSTRUCTIONS,
    schema: ResultsSchema,
    jsonSchema: resultsJsonSchema,
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
    },
    "ai_extraction_results_complete"
  );

  return {
    data,
    confidencePercent,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
  };
}
