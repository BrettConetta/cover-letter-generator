import { normalizeResumeLineBreaks } from "./normalizeResumeText.js";

const EMAIL_PATTERN =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const PHONE_PATTERN =
  /(?:\+?\d{1,3}[-.\s\u2013\u2014]*)?(?:\(?\d{3}\)?[-.\s\u2013\u2014]*){1,2}\d{4}/g;

const URL_PATTERN = /https?:\/\/\S+/gi;

const LINKEDIN_PATTERN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/\S+/gi;

const GITHUB_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+\/?/gi;

const PORTFOLIO_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?brettconetta\.dev\/?/gi;

const HEADER_LINE_COUNT = 3;

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

  // No recognizable section start — keep text and rely on inline pattern removal.
  return text;
}

function stripResumeHeader(text: string): string {
  if (isCollapsedLayout(text)) {
    return stripCollapsedResumeHeader(text);
  }

  const lines = text.split("\n");
  const result: string[] = [];
  let removed = 0;
  let skippingLeadingBlanks = true;

  for (const line of lines) {
    const trimmed = line.trim();

    if (skippingLeadingBlanks && !trimmed) {
      continue;
    }
    skippingLeadingBlanks = false;

    if (removed < HEADER_LINE_COUNT && trimmed) {
      if (isSectionHeaderLine(trimmed)) {
        result.push(line);
        removed = HEADER_LINE_COUNT;
        continue;
      }

      removed++;
      continue;
    }

    result.push(line);
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
