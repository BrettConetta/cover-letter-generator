import { z } from "zod";

export const ResumeChunkSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
  section: z.enum([
    "summary",
    "experience",
    "skills",
    "education",
    "projects",
    "certifications",
    "publications",
    "patents",
    "awards",
    "languages",
    "interests",
    "references",
  ] as const),
  text: z.string().trim().min(1, "Text is required"),
});

export type ResumeChunk = z.infer<typeof ResumeChunkSchema>;
