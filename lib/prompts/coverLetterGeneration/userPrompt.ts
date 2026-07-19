import type { GenerateCoverLetterInput } from "../types.js";

export function buildCoverLetterUserPrompt(
  input: GenerateCoverLetterInput,
): string {
  const { jobDescription, resumeText } = input;

  return `<job_description>
${jobDescription.trim()}
</job_description>

<resume>
${resumeText.trim()}
</resume>

Analyze the job description for the top 3 problems this employer needs to solve, then write a tailored cover letter for this candidate applying to this role. The letter must sound human-written: conversational and confident, grounded only in resume facts, and free of generic AI phrasing.`;
}
