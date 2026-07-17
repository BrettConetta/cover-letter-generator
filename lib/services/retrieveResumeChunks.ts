import { ResumeChunk } from "../schemas/resumeChunk.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";
import { embedText } from "./embedText.js";
import { indexResume } from "./resumeIndexService.js";

type RetrieveResumeChunksOptions = {
  maxChunks?: number;
  ensureSections?: string[];
  ensureLatestExperience?: boolean;
  minScore?: number;
};

export async function retrieveResumeChunks(
  projectRoot: string,
  jobDescriptionText: string,
  options: RetrieveResumeChunksOptions = {},
): Promise<ResumeChunk[]> {
  const {
    maxChunks = 6,
    ensureSections = ["summary", "skills"],
    ensureLatestExperience = true,
    minScore = 0,
  } = options;

  const selected: ResumeChunk[] = [];
  const selectedIds = new Set<string>();

  // helper function to add a chunk to the selected list if it's not already in the list and the list is not full
  function tryAdd(chunk: ResumeChunk) {
    if (selected.length >= maxChunks) return;
    if (selectedIds.has(chunk.id)) return;
    selected.push(chunk);
    selectedIds.add(chunk.id);
  }

  // index the resume and embed the job description
  const resumeIndex = await indexResume(projectRoot);
  const jobDescriptionEmbedding = await embedText(jobDescriptionText);

  // calculate the similarity scores for each chunk and sort them by similarity
  const similarityScores: { chunk: ResumeChunk; similarity: number }[] = [];
  for (const chunk of resumeIndex) {
    const similarity = cosineSimilarity(
      chunk.embedding,
      jobDescriptionEmbedding,
    );
    similarityScores.push({ chunk: chunk.chunk, similarity });
  }
  similarityScores.sort((a, b) => b.similarity - a.similarity);

  for (const section of ensureSections) {
    const match = similarityScores.find((s) => s.chunk.section === section);
    if (match) {
      tryAdd(match.chunk);
    }
  }
  if (ensureLatestExperience) {
    const latest = similarityScores.find((s) => s.chunk.id === "experience-0");
    if (latest) {
      tryAdd(latest.chunk);
    }
  }
  for (const score of similarityScores) {
    if (selected.length >= maxChunks) break;
    if (score.similarity < minScore) continue;
    if (selectedIds.has(score.chunk.id)) continue;
    tryAdd(score.chunk);
  }
  return selected;
}
