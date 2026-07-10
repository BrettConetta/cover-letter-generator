import fs from "node:fs/promises";
import path from "node:path";
import { stripContactInfo } from "../utils/stripContactInfo.js";

export function getResumeFilePath(projectRoot: string): string {
  return path.join(projectRoot, "data", "resume.txt");
}

export async function readStoredResume(projectRoot: string): Promise<string> {
  try {
    return await fs.readFile(getResumeFilePath(projectRoot), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

export async function writeStoredResume(
  projectRoot: string,
  rawText: string
): Promise<string> {
  const sanitized = stripContactInfo(rawText);
  const filePath = getResumeFilePath(projectRoot);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, sanitized, "utf8");
  return sanitized;
}

export async function clearStoredResume(projectRoot: string): Promise<void> {
  try {
    await fs.unlink(getResumeFilePath(projectRoot));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
}
