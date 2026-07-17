import fs from "node:fs";
import path from "node:path";

export function getResumeFilePath(projectRoot: string): string {
  return path.join(projectRoot, "data", "resume.txt");
}

export function getResumeIndexPath(projectRoot: string): string {
  return path.join(projectRoot, "data", "resumeIndex.json");
}

export function readResumeFile(projectRoot: string): string {
  try {
    return fs.readFileSync(getResumeFilePath(projectRoot), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }
    throw error;
  }
}
