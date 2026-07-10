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

export async function fetchStoredResume(): Promise<string> {
  const response = await fetch("/api/resume");

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to load saved resume")
    );
  }

  const body = (await response.json()) as { text?: unknown };
  return typeof body.text === "string" ? body.text : "";
}

export async function saveStoredResume(text: string): Promise<string> {
  const response = await fetch("/api/resume", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to save resume")
    );
  }

  const body = (await response.json()) as { text?: unknown };
  if (typeof body.text !== "string") {
    throw new Error("Received invalid resume data from the server");
  }

  return body.text;
}

export async function clearStoredResume(): Promise<void> {
  const response = await fetch("/api/resume", { method: "DELETE" });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to clear saved resume")
    );
  }
}
