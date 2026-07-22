import { ResumeChunk } from "../schemas/resumeChunk.js";

export type GenerateCoverLetterInput = {
  jobDescription: string;
  resumeText: string;
};

export type TailorResumeInput = {
  jobDescription: string;
  chunks: ResumeChunk[];
};
