import {
  TailoredResumeResponseSchema,
  type TailoredResumeResponse,
} from "../../../lib/schemas/tailoredResume.js";

export type TailorResumePayload = {
  jobDescription: string;
  /** Omit when using the stored master resume so the backend uses its cached index. */
  resumeText?: string;
};

export async function tailorResume(
  payload: TailorResumePayload,
): Promise<TailoredResumeResponse> {
  const body: { jobDescription: string; resumeText?: string } = {
    jobDescription: payload.jobDescription,
  };

  if (payload.resumeText !== undefined) {
    body.resumeText = payload.resumeText;
  }

  const response = await fetch("/api/resume/tailor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  if (!response.ok) {
    let message = "Failed to tailor resume";

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

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(text);
  } catch {
    throw new Error("Received invalid response from the server");
  }

  const parsed = TailoredResumeResponseSchema.safeParse(parsedBody);
  if (!parsed.success) {
    console.error("Invalid tailored resume response:", parsed.error.flatten());
    throw new Error("Received invalid tailored resume data from the server");
  }

  return parsed.data;
}
