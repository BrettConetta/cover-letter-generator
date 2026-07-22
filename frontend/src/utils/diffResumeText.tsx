import { diffWordsWithSpace, type Change } from "diff";
import type { ReactNode } from "react";

const LINE_MATCH_THRESHOLD = 0.3;

function splitKeepNewlines(text: string): string[] {
  if (!text) {
    return [];
  }

  return text.split(/(?<=\n)/).filter((part) => part.length > 0);
}

function tokenizeForMatch(text: string): string[] {
  return (
    text
      .toLowerCase()
      .replace(/[•]/g, "")
      .match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? []
  );
}

/** Token Jaccard — better than raw edit ratio for reordered/rewritten bullets. */
function lineSimilarity(a: string, b: string): number {
  const left = new Set(tokenizeForMatch(a));
  const right = new Set(tokenizeForMatch(b));

  if (left.size === 0 && right.size === 0) {
    return 1;
  }

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  return intersection / (left.size + right.size - intersection);
}

function matchLines(
  originalLines: string[],
  suggestedLines: string[],
): { originalToSuggested: Map<number, number>; suggestedToOriginal: Map<number, number> } {
  const candidates: { originalIndex: number; suggestedIndex: number; score: number }[] =
    [];

  for (let i = 0; i < originalLines.length; i++) {
    for (let j = 0; j < suggestedLines.length; j++) {
      const score = lineSimilarity(originalLines[i]!, suggestedLines[j]!);
      if (score >= LINE_MATCH_THRESHOLD) {
        candidates.push({ originalIndex: i, suggestedIndex: j, score });
      }
    }
  }

  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      Math.abs(a.originalIndex - a.suggestedIndex) -
        Math.abs(b.originalIndex - b.suggestedIndex),
  );

  const originalToSuggested = new Map<number, number>();
  const suggestedToOriginal = new Map<number, number>();

  for (const { originalIndex, suggestedIndex } of candidates) {
    if (
      originalToSuggested.has(originalIndex) ||
      suggestedToOriginal.has(suggestedIndex)
    ) {
      continue;
    }
    originalToSuggested.set(originalIndex, suggestedIndex);
    suggestedToOriginal.set(suggestedIndex, originalIndex);
  }

  return { originalToSuggested, suggestedToOriginal };
}

function renderChangeParts(
  parts: Change[],
  mode: "original" | "suggested",
  keyPrefix: string,
): ReactNode[] {
  const nodes: ReactNode[] = [];

  for (const [index, part] of parts.entries()) {
    if (mode === "original" && part.added) {
      continue;
    }
    if (mode === "suggested" && part.removed) {
      continue;
    }

    const isHighlight =
      (mode === "original" && part.removed) ||
      (mode === "suggested" && part.added);

    if (!isHighlight) {
      nodes.push(<span key={`${keyPrefix}-${index}`}>{part.value}</span>);
      continue;
    }

    nodes.push(
      <mark
        key={`${keyPrefix}-${index}`}
        className={
          mode === "original"
            ? "rounded-sm bg-red-100 text-red-900"
            : "rounded-sm bg-green-100 text-green-900"
        }
      >
        {part.value}
      </mark>,
    );
  }

  return nodes;
}

function highlightLine(
  line: string,
  mode: "original" | "suggested",
  key: string,
): ReactNode {
  return (
    <mark
      key={key}
      className={
        mode === "original"
          ? "rounded-sm bg-red-100 text-red-900"
          : "rounded-sm bg-green-100 text-green-900"
      }
    >
      {line}
    </mark>
  );
}

function renderSide(
  originalText: string,
  suggestedText: string,
  mode: "original" | "suggested",
): ReactNode {
  const originalLines = splitKeepNewlines(originalText);
  const suggestedLines = splitKeepNewlines(suggestedText);
  const { originalToSuggested, suggestedToOriginal } = matchLines(
    originalLines,
    suggestedLines,
  );

  const nodes: ReactNode[] = [];

  if (mode === "original") {
    for (const [index, line] of originalLines.entries()) {
      const suggestedIndex = originalToSuggested.get(index);
      if (suggestedIndex == null) {
        nodes.push(highlightLine(line, mode, `orig-full-${index}`));
        continue;
      }

      const matched = suggestedLines[suggestedIndex]!;
      if (line === matched) {
        nodes.push(<span key={`orig-eq-${index}`}>{line}</span>);
        continue;
      }

      nodes.push(
        ...renderChangeParts(
          diffWordsWithSpace(line, matched),
          mode,
          `orig-${index}`,
        ),
      );
    }
  } else {
    for (const [index, line] of suggestedLines.entries()) {
      const originalIndex = suggestedToOriginal.get(index);
      if (originalIndex == null) {
        nodes.push(highlightLine(line, mode, `sug-full-${index}`));
        continue;
      }

      const matched = originalLines[originalIndex]!;
      if (line === matched) {
        nodes.push(<span key={`sug-eq-${index}`}>{line}</span>);
        continue;
      }

      nodes.push(
        ...renderChangeParts(
          diffWordsWithSpace(matched, line),
          mode,
          `sug-${index}`,
        ),
      );
    }
  }

  return <>{nodes}</>;
}

export function renderOriginalDiff(
  originalText: string,
  suggestedText: string,
): ReactNode {
  return renderSide(originalText, suggestedText, "original");
}

export function renderSuggestedDiff(
  originalText: string,
  suggestedText: string,
): ReactNode {
  return renderSide(originalText, suggestedText, "suggested");
}
