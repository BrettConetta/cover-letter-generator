import fs from "node:fs";
import path from "node:path";
import { getResumeFilePath, readResumeFile } from "../utils/resumeFiles.js";
import { stripContactInfo } from "../utils/stripContactInfo.js";
import {
  clearStoredApplicant,
  extractAndStoreApplicant,
} from "./applicantStorageService.js";
import { clearResumeIndex } from "./resumeIndexService.js";

export function readStoredResume(projectRoot: string): string {
  return readResumeFile(projectRoot);
}

export function writeStoredResume(
  projectRoot: string,
  rawText: string,
): string {
  extractAndStoreApplicant(projectRoot, rawText);
  const sanitized = stripContactInfo(rawText);
  const filePath = getResumeFilePath(projectRoot);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, sanitized, "utf8");
  clearResumeIndex(projectRoot);
  return sanitized;
}

export function clearStoredResume(projectRoot: string) {
  try {
    fs.unlinkSync(getResumeFilePath(projectRoot));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  clearStoredApplicant(projectRoot);
  clearResumeIndex(projectRoot);
}
