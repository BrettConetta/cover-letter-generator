import { z } from "zod";

export const GenerateCoverLetterRequestSchema = z.object({
  jobDescription: z.string().min(1, "Job description is required"),
  resumeText: z.string().min(1, "Resume text is required"),
});

export type GenerateCoverLetterRequest = z.infer<
  typeof GenerateCoverLetterRequestSchema
>;

export const CoverLetterResponseSchema = z.object({
  coverLetter: z.string().min(1),
  companyName: z.string(),
});

export type CoverLetterResponse = z.infer<typeof CoverLetterResponseSchema>;
