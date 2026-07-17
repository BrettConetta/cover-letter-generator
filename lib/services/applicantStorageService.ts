import fs from "node:fs";
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

export function readStoredApplicant(projectRoot: string): ApplicantInfo {
  try {
    const raw = fs.readFileSync(getApplicantFilePath(projectRoot), "utf8");
    const parsed = ApplicantInfoSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_APPLICANT;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return EMPTY_APPLICANT;
    }
    throw error;
  }
}

export function writeStoredApplicant(
  projectRoot: string,
  applicant: ApplicantInfo,
): ApplicantInfo {
  const validated = ApplicantInfoSchema.parse(applicant);
  const filePath = getApplicantFilePath(projectRoot);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  return validated;
}

export function extractAndStoreApplicant(
  projectRoot: string,
  rawResumeText: string,
): ApplicantInfo {
  const extracted = extractContactInfo(rawResumeText);
  const existing = readStoredApplicant(projectRoot);
  const merged = mergeApplicantInfo(existing, extracted);
  return writeStoredApplicant(projectRoot, merged);
}

export function clearStoredApplicant(projectRoot: string) {
  try {
    fs.unlinkSync(getApplicantFilePath(projectRoot));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
}
