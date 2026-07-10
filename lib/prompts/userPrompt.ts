import type { GenerateCoverLetterInput } from "./types.js";

export function buildCoverLetterUserPrompt(
  input: GenerateCoverLetterInput
): string {
  const { jobDescription, resumeText } = input;

  return `Job Description:
"""
${jobDescription.trim()}
"""

Candidate Resume:
"""
${resumeText.trim()}
"""

Write a tailored cover letter for this candidate applying to this role.`;
}
