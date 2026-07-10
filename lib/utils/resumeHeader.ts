import { normalizeResumeLineBreaks } from "./normalizeResumeText.js";

const SECTION_HEADER_LINE =
  /^(?:Summary|Experience|Education|Skills|Projects|Work Experience|Technical Skills|Professional Summary)\s*$/i;

const FIRST_SECTION_PATTERN =
  /\b(?:Summary|Experience|Education|Skills|Projects|Work Experience|Technical Skills|Professional Summary)\b/i;

const MAX_HEADER_LINES = 5;

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

function splitHeaderChunk(headerChunk: string): string[] {
  return headerChunk
    .split(/\n|[|•]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, MAX_HEADER_LINES);
}

export function getResumeHeaderLines(text: string): string[] {
  const normalized = normalizeResumeLineBreaks(text);

  if (isCollapsedLayout(normalized)) {
    const match = FIRST_SECTION_PATTERN.exec(normalized);
    const headerChunk =
      match?.index !== undefined && match.index > 0
        ? normalized.slice(0, match.index)
        : normalized.slice(0, 500);

    return splitHeaderChunk(headerChunk);
  }

  const lines = normalized.split("\n");
  const headerLines: string[] = [];
  let skippingLeadingBlanks = true;

  for (const line of lines) {
    const trimmed = line.trim();

    if (skippingLeadingBlanks && !trimmed) {
      continue;
    }
    skippingLeadingBlanks = false;

    if (isSectionHeaderLine(trimmed)) {
      break;
    }

    if (trimmed) {
      headerLines.push(trimmed);
      if (headerLines.length >= MAX_HEADER_LINES) {
        break;
      }
    }
  }

  return headerLines;
}
