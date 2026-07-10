import { normalizeResumeLineBreaks } from "./normalizeResumeText.js";
import {
  EMAIL_PATTERN,
  GITHUB_PATTERN,
  LINKEDIN_PATTERN,
  PHONE_PATTERN,
  PORTFOLIO_PATTERN,
  URL_PATTERN,
} from "./contactPatterns.js";
import { getResumeHeaderLines } from "./resumeHeader.js";

const SECTION_HEADER_LINE =
  /^(?:Summary|Experience|Education|Skills|Projects|Work Experience|Technical Skills|Professional Summary)\s*$/i;

const FIRST_SECTION_PATTERN =
  /\b(?:Summary|Experience|Education|Skills|Projects|Work Experience|Technical Skills|Professional Summary)\b/i;

function isSectionHeaderLine(line: string): boolean {
  return SECTION_HEADER_LINE.test(line.trim());
}

function isCollapsedLayout(text: string): boolean {
  const lines = text.split("\n").filter((line) => line.trim());

  if (lines.length <= 1) {
    return true;
  }

  const longestLine = Math.max(...lines.map((line) => line.length));
  return lines.length <= 4 && longestLine > 300;
}

function stripCollapsedResumeHeader(text: string): string {
  const match = FIRST_SECTION_PATTERN.exec(text);
  if (match?.index !== undefined && match.index > 0) {
    return text.slice(match.index).trimStart();
  }

  return text;
}

function stripResumeHeader(text: string): string {
  if (isCollapsedLayout(text)) {
    return stripCollapsedResumeHeader(text);
  }

  const headerLines = getResumeHeaderLines(text);
  if (headerLines.length === 0) {
    return text;
  }

  const headerLineSet = new Set(headerLines);
  const lines = text.split("\n");
  const result: string[] = [];
  let skippingLeadingBlanks = true;
  let inHeader = true;

  for (const line of lines) {
    const trimmed = line.trim();

    if (skippingLeadingBlanks && !trimmed) {
      continue;
    }
    skippingLeadingBlanks = false;

    if (inHeader) {
      if (trimmed && headerLineSet.has(trimmed)) {
        continue;
      }

      if (isSectionHeaderLine(trimmed)) {
        inHeader = false;
        result.push(line);
        continue;
      }

      if (trimmed) {
        inHeader = false;
      }
    }

    if (!inHeader) {
      result.push(line);
    }
  }

  return result.join("\n");
}

function stripInlineContactInfo(text: string): string {
  return text
    .replace(EMAIL_PATTERN, "")
    .replace(PHONE_PATTERN, "")
    .replace(URL_PATTERN, "")
    .replace(LINKEDIN_PATTERN, "")
    .replace(GITHUB_PATTERN, "")
    .replace(PORTFOLIO_PATTERN, "")
    .replace(/[ \t]{2,}/g, " ");
}

export function stripContactInfo(text: string): string {
  return normalizeResumeLineBreaks(
    stripInlineContactInfo(stripResumeHeader(text))
  );
}
