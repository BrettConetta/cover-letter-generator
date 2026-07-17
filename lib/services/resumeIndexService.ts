import fs from "node:fs";
import { ResumeChunk } from "../schemas/resumeChunk.js";
import { ResumeIndex, ResumeIndexSchema } from "../schemas/resumeIndex.js";
import { chunkResume } from "../utils/chunkResume.js";
import { getResumeIndexPath, readResumeFile } from "../utils/resumeFiles.js";
import { embedText } from "./embedText.js";

export async function indexResume(projectRoot: string): Promise<ResumeIndex> {
  const resumeText = readResumeFile(projectRoot);
  if (!resumeText.trim()) {
    return [];
  }

  return embedResumeAndSaveIndex(
    getResumeIndexPath(projectRoot),
    chunkResume(resumeText),
  );
}

export function loadResumeIndex(projectRoot: string): ResumeIndex {
  const resumeIndexPath = getResumeIndexPath(projectRoot);

  try {
    return ResumeIndexSchema.parse(
      JSON.parse(fs.readFileSync(resumeIndexPath, "utf8")),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function clearResumeIndex(projectRoot: string): void {
  const resumeIndexPath = getResumeIndexPath(projectRoot);

  try {
    fs.unlinkSync(resumeIndexPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
}

function chunksMatchCache(chunks: ResumeChunk[], cached: ResumeIndex): boolean {
  if (chunks.length !== cached.length) return false;
  return chunks.every(
    (chunk, i) =>
      chunk.id === cached[i]!.chunk.id && chunk.text === cached[i]!.chunk.text,
  );
}

async function embedResumeAndSaveIndex(
  resumeIndexPath: string,
  chunks: ResumeChunk[],
): Promise<ResumeIndex> {
  let chunkEmbeddings: {
    chunk: ResumeChunk;
    embedding: number[];
  }[] = [];

  let shouldRebuildIndex = true;
  if (fs.existsSync(resumeIndexPath)) {
    const fileContents = fs.readFileSync(resumeIndexPath, "utf8");
    if (fileContents.trim().length) {
      try {
        const cached = ResumeIndexSchema.parse(JSON.parse(fileContents));
        if (chunksMatchCache(chunks, cached)) {
          chunkEmbeddings = cached;
          shouldRebuildIndex = false;
        }
      } catch (error) {
        console.error("Failed to parse resume index file:", error);
      }
    }
  }

  if (shouldRebuildIndex) {
    for (const chunk of chunks) {
      chunkEmbeddings.push({
        chunk,
        embedding: await embedText(chunk.text),
      });
    }
    try {
      fs.writeFileSync(
        resumeIndexPath,
        JSON.stringify(chunkEmbeddings, null, 2),
      );
    } catch (error) {
      // If the write fails, log the error, but always return the in-memory index so downstream processes can continue.
      console.error("Failed to write resume index file:", error);
    }
  }

  return chunkEmbeddings;
}
