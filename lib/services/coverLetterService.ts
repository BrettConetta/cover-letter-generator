import Anthropic from "@anthropic-ai/sdk";
import {
  COVER_LETTER_JSON_RETRY_PROMPT,
  COVER_LETTER_SYSTEM_PROMPT,
  buildCoverLetterUserPrompt,
  type GenerateCoverLetterInput,
} from "../prompts/index.js";
import {
  CoverLetterResponseSchema,
  type CoverLetterResponse,
} from "../schemas/coverLetter.js";

export type { GenerateCoverLetterInput };

let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

export async function generateCoverLetter(
  input: GenerateCoverLetterInput,
): Promise<CoverLetterResponse> {
  const client = getAnthropicClient();
  const userPrompt = buildCoverLetterUserPrompt(input);

  const baseRequest = {
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 2048,
    system: COVER_LETTER_SYSTEM_PROMPT,
  } as const;

  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.messages.create({
      ...baseRequest,
      messages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Anthropic returned no text content");
    }

    const rawText = textBlock.text;

    try {
      return parseCoverLetterResponse(rawText);
    } catch (error) {
      console.error(`Cover letter parse failed (attempt ${attempt}):`, rawText);
      if (attempt === 1) {
        throw new Error(
          "Claude returned invalid cover letter JSON after retry",
        );
      }
      messages = [
        { role: "user", content: userPrompt },
        { role: "assistant", content: rawText },
        { role: "user", content: COVER_LETTER_JSON_RETRY_PROMPT },
      ];
    }
  }

  throw new Error("Unreachable");
}

function parseCoverLetterResponse(rawText: string): CoverLetterResponse {
  const parsed = JSON.parse(extractJson(rawText));
  return CoverLetterResponseSchema.parse(parsed);
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1].trim() : trimmed;
}
