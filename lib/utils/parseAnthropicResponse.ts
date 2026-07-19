import type { ZodType } from "zod";

export function parseClaudeResponse<T>(rawText: string, schema: ZodType<T>): T {
  const parsed = JSON.parse(extractJson(rawText));
  return schema.parse(parsed);
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1].trim() : trimmed;
}
