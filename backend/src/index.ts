import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { z } from "zod";
import { generateCoverLetter } from "../../lib/services/coverLetterService.js";
import { GenerateCoverLetterRequestSchema } from "../../lib/schemas/coverLetter.js";
import {
  clearStoredResume,
  readStoredResume,
  writeStoredResume,
} from "../../lib/services/resumeStorageService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(
  __dirname,
  __dirname.includes(`${path.sep}dist${path.sep}`) ? "../../../.." : "../.."
);
dotenv.config({ path: path.resolve(PROJECT_ROOT, ".env") });

const SaveResumeRequestSchema = z.object({
  text: z.string().min(1, "Resume text is required"),
});

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/api/resume", async (_req: Request, res: Response) => {
  try {
    const text = await readStoredResume(PROJECT_ROOT);
    return res.json({ text });
  } catch (error) {
    console.error("Failed to read stored resume:", error);
    return res.status(500).json({ error: "Failed to read stored resume" });
  }
});

app.put("/api/resume", async (req: Request, res: Response) => {
  try {
    const parsed = SaveResumeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => issue.message)
        .join("; ");
      return res.status(400).json({ error: message });
    }

    const text = await writeStoredResume(PROJECT_ROOT, parsed.data.text);
    return res.json({ text });
  } catch (error) {
    console.error("Failed to save resume:", error);
    return res.status(500).json({ error: "Failed to save resume" });
  }
});

app.delete("/api/resume", async (_req: Request, res: Response) => {
  try {
    await clearStoredResume(PROJECT_ROOT);
    return res.status(204).send();
  } catch (error) {
    console.error("Failed to clear stored resume:", error);
    return res.status(500).json({ error: "Failed to clear stored resume" });
  }
});

app.post("/api/generate", async (req: Request, res: Response) => {
  try {
    const parsed = GenerateCoverLetterRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => issue.message)
        .join("; ");
      return res.status(400).json({ error: message });
    }

    const result = await generateCoverLetter(parsed.data);
    return res.json(result);
  } catch (error) {
    console.error("Cover letter generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate cover letter";
    const status = message.includes("ANTHROPIC_API_KEY") ? 500 : 502;
    return res.status(status).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
