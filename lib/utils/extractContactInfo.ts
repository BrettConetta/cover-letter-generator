import { EMPTY_APPLICANT, type ApplicantInfo } from "../schemas/applicant.js";
import {
  EMAIL_PATTERN,
  LINKEDIN_PATTERN,
  LOCATION_PATTERN,
  LOCATION_PREFIX_PATTERN,
  PHONE_PATTERN,
  URL_PATTERN,
} from "./contactPatterns.js";
import { getResumeHeaderLines } from "./resumeHeader.js";

function isContactOrLinkLine(line: string): boolean {
  return (
    EMAIL_PATTERN.test(line) ||
    PHONE_PATTERN.test(line) ||
    URL_PATTERN.test(line) ||
    LINKEDIN_PATTERN.test(line)
  );
}

function extractEmail(text: string): string {
  return text.match(EMAIL_PATTERN)?.[0] ?? "";
}

function extractPhone(text: string): string {
  return text.match(PHONE_PATTERN)?.[0]?.trim() ?? "";
}

function parseLocationFromLine(
  line: string,
): Pick<ApplicantInfo, "city" | "state" | "zip"> | null {
  const fullLineMatch = line.match(LOCATION_PATTERN);
  if (fullLineMatch) {
    return {
      city: fullLineMatch[1].trim(),
      state: fullLineMatch[2].trim(),
      zip: fullLineMatch[3]?.trim(),
    };
  }

  const prefixMatch = line.match(LOCATION_PREFIX_PATTERN);
  if (prefixMatch) {
    return {
      city: prefixMatch[1].trim(),
      state: prefixMatch[2].trim(),
      zip: prefixMatch[3]?.trim(),
    };
  }

  return null;
}

export function extractContactInfo(rawText: string): ApplicantInfo {
  const headerLines = getResumeHeaderLines(rawText);
  const headerText = headerLines.join("\n");

  const applicant: ApplicantInfo = {
    ...EMPTY_APPLICANT,
    email: extractEmail(headerText),
    phone: extractPhone(headerText),
  };

  for (const line of headerLines) {
    const location = parseLocationFromLine(line);
    if (location) {
      applicant.city = location.city;
      applicant.state = location.state;
      applicant.zip = location.zip;
    }

    if (isContactOrLinkLine(line)) {
      if (!applicant.email) {
        applicant.email = extractEmail(line);
      }
      if (!applicant.phone) {
        applicant.phone = extractPhone(line);
      }
      continue;
    }

    if (!applicant.fullName) {
      applicant.fullName = line.trim();
    }
  }

  return applicant;
}
