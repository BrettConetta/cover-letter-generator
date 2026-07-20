import type { TailorResumeInput } from "../types.js";

export function buildTailorResumeUserPrompt(input: TailorResumeInput): string {
  const { jobDescription, chunks } = input;

  const chunksJson = JSON.stringify(
    chunks.map((chunk) => ({
      id: chunk.id,
      section: chunk.section,
      text: chunk.text,
    })),
    null,
    2,
  );

  return `<job_description>
${jobDescription.trim()}
</job_description>

<resume_chunks>
${chunksJson}
</resume_chunks>

Using only the resume chunks above, produce ATS-friendly tailoring suggestions for this job description.
Return exactly one suggestion per chunk. originalText must be the full chunk text; suggestedText must be a full chunk replacement (unchanged bullets included).
Ground every change in the provided chunks only — do not invent experience or assume omitted sections exist.`;
}
