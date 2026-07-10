import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateCoverLetter } from "../lib/services/coverLetterService.js";
import { GenerateCoverLetterRequestSchema } from "../lib/schemas/coverLetter.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const parsed = GenerateCoverLetterRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join("; ");
      return res.status(400).json({ error: message });
    }

    const result = await generateCoverLetter(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Cover letter generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate cover letter";
    const status = message.includes("ANTHROPIC_API_KEY") ? 500 : 502;
    return res.status(status).json({ error: message });
  }
}
