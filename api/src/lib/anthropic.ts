import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env.js";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to environment variables to enable AI extraction."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

export function isAiAvailable(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}
