import {
  CoverLetterResponseSchema,
  type CoverLetterResponse,
} from "../../../lib/schemas/coverLetter";

export type GenerateCoverLetterPayload = {
  jobDescription: string;
  resumeText: string;
};

export async function generateCoverLetter(
  payload: GenerateCoverLetterPayload,
): Promise<CoverLetterResponse> {
  const response = await fetch("/api/cover-letter/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  if (!response.ok) {
    let message = "Failed to generate cover letter";

    if (text) {
      try {
        const errorBody = JSON.parse(text) as { error?: unknown };
        if (typeof errorBody.error === "string" && errorBody.error.trim()) {
          message = errorBody.error;
        }
      } catch {
        // non-JSON error body
      }
    } else if (
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504
    ) {
      message = "API unavailable. Please try again later.";
    }

    throw new Error(message);
  }

  if (!text) {
    throw new Error("Received empty response from the server");
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error("Received invalid response from the server");
  }

  const parsed = CoverLetterResponseSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Invalid cover letter response:", parsed.error.flatten());
    throw new Error("Received invalid cover letter data from the server");
  }

  return parsed.data;
}
