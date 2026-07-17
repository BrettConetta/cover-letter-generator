import { z } from "zod";
import { ResumeChunkSchema } from "./resumeChunk.js";

export const IndexedResumeChunkSchema = z.object({
  chunk: ResumeChunkSchema,
  embedding: z.array(z.number()).min(1),
});

export type IndexedResumeChunk = z.infer<typeof IndexedResumeChunkSchema>;

export const ResumeIndexSchema = z.array(IndexedResumeChunkSchema);

export type ResumeIndex = z.infer<typeof ResumeIndexSchema>;
