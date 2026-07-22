const SECTION_HEADER_LINE =
  /^(?:Summary|Experience|Education|Skills|Projects|Work Experience|Technical Skills|Professional Summary)\s*$/i;

/** Company / school / project meta lines that use a mid-line bullet separator. */
const META_WITH_BULLET = /^.+\s•\s+.+$/;

/** Role or dated headings (e.g. "Software Engineer October 2022 – December 2025"). */
const DATED_HEADING = /\b(?:19|20)\d{2}\b/;

/** Line ends on a word that almost always continues onto the next line when wrapped. */
const INCOMPLETE_LINE_ENDING =
  /\b(?:a|an|the|as|to|of|for|and|or|with|from|by|in|on|at|into|onto|over|under|via|using|across|through|per|vs\.?)$/i;

function isStructuralLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }
  if (trimmed.startsWith("•")) {
    return true;
  }
  if (SECTION_HEADER_LINE.test(trimmed)) {
    return true;
  }
  if (META_WITH_BULLET.test(trimmed)) {
    return true;
  }
  if (DATED_HEADING.test(trimmed)) {
    return true;
  }
  return false;
}

function isSoftWrapContinuation(previous: string, next: string): boolean {
  const prev = previous.trimEnd();
  const trimmedNext = next.trim();

  if (!prev || !trimmedNext) {
    return false;
  }
  if (isStructuralLine(trimmedNext)) {
    return false;
  }

  // PDF hyphenation: "cross-\nteam" → "cross-team"
  if (/[A-Za-z]-$/.test(prev)) {
    return true;
  }

  // Mid-sentence wrap: next line continues with lowercase or a digit ("66%+")
  if (/^[a-z0-9]/.test(trimmedNext)) {
    return true;
  }

  // "served as\nScrum Master" — previous line ends mid-phrase
  if (INCOMPLETE_LINE_ENDING.test(prev)) {
    return true;
  }

  // Capitalized continuation of a bullet that was split mid-phrase
  // (e.g. "Test Driven\nDevelopment") — only when still inside bullet text.
  if (prev.trimStart().startsWith("•") && !/[.!?]$/.test(prev)) {
    return true;
  }

  return false;
}

function joinSoftWrap(previous: string, next: string): string {
  const prev = previous.trimEnd();
  const trimmedNext = next.trim();

  if (/[A-Za-z]-$/.test(prev)) {
    return prev + trimmedNext;
  }

  return `${prev} ${trimmedNext}`;
}

/**
 * Collapse PDF/extraction artifacts: blank lines before bullets, and soft-wrapped
 * continuations of the same sentence/bullet onto one line.
 */
export function normalizeResumeLineBreaks(text: string): string {
  const prepared = text
    // PDF page breaks often insert a blank line before the next bullet.
    .replace(/\n\n+(?=•\s)/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  const lines = prepared.split("\n");
  const merged: string[] = [];

  for (const line of lines) {
    const previous = merged[merged.length - 1];
    if (previous !== undefined && isSoftWrapContinuation(previous, line)) {
      merged[merged.length - 1] = joinSoftWrap(previous, line);
      continue;
    }
    merged.push(line);
  }

  return merged.join("\n").trim();
}
