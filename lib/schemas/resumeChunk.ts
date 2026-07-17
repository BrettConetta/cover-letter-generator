import { z } from "zod";

export const ResumeChunkSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
  section: z.string().trim().min(1, "Section is required"),
  text: z.string().trim().min(1, "Text is required"),
});

export type ResumeChunk = z.infer<typeof ResumeChunkSchema>;
