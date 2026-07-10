import fs from "node:fs/promises";
import path from "node:path";
import {
  ApplicantInfoSchema,
  EMPTY_APPLICANT,
  mergeApplicantInfo,
  type ApplicantInfo,
} from "../schemas/applicant.js";
import { extractContactInfo } from "../utils/extractContactInfo.js";

export function getApplicantFilePath(projectRoot: string): string {
  return path.join(projectRoot, "data", "applicant.json");
}

export async function readStoredApplicant(
  projectRoot: string
): Promise<ApplicantInfo> {
  try {
    const raw = await fs.readFile(getApplicantFilePath(projectRoot), "utf8");
    const parsed = ApplicantInfoSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_APPLICANT;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return EMPTY_APPLICANT;
    }
    throw error;
  }
}

export async function writeStoredApplicant(
  projectRoot: string,
  applicant: ApplicantInfo
): Promise<ApplicantInfo> {
  const validated = ApplicantInfoSchema.parse(applicant);
  const filePath = getApplicantFilePath(projectRoot);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  return validated;
}

export async function extractAndStoreApplicant(
  projectRoot: string,
  rawResumeText: string
): Promise<ApplicantInfo> {
  const extracted = extractContactInfo(rawResumeText);
  const existing = await readStoredApplicant(projectRoot);
  const merged = mergeApplicantInfo(existing, extracted);
  return writeStoredApplicant(projectRoot, merged);
}

export async function clearStoredApplicant(projectRoot: string): Promise<void> {
  try {
    await fs.unlink(getApplicantFilePath(projectRoot));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
}
