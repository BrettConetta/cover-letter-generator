import {
  ApplicantInfoSchema,
  type ApplicantInfo,
} from "../../../lib/schemas/applicant";

async function parseErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const text = await response.text();

  if (!text) {
    return fallback;
  }

  try {
    const body = JSON.parse(text) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) {
      return body.error;
    }
  } catch {
    // non-JSON error body
  }

  return fallback;
}

function parseApplicantResponse(body: unknown): ApplicantInfo {
  if (
    typeof body === "object" &&
    body !== null &&
    "applicant" in body
  ) {
    const parsed = ApplicantInfoSchema.safeParse(body.applicant);
    if (parsed.success) {
      return parsed.data;
    }
  }

  throw new Error("Received invalid applicant data from the server");
}

export async function fetchStoredApplicant(): Promise<ApplicantInfo> {
  const response = await fetch("/api/applicant");

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to load contact info")
    );
  }

  return parseApplicantResponse(await response.json());
}

export async function extractApplicantFromResume(
  text: string
): Promise<ApplicantInfo> {
  const response = await fetch("/api/applicant/extract", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to extract contact info")
    );
  }

  return parseApplicantResponse(await response.json());
}
