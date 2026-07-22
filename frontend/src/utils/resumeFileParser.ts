import mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { normalizeResumeLineBreaks } from "../../../lib/utils/normalizeResumeText.js";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx", ".pdf"] as const;
const PDF_LINE_Y_TOLERANCE = 4;

type PositionedTextItem = {
  str: string;
  x: number;
  y: number;
};

function isTextItem(item: unknown): item is TextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof (item as TextItem).str === "string"
  );
}

function groupPdfTextItemsIntoLines(items: unknown[]): string[] {
  const positioned: PositionedTextItem[] = [];

  for (const item of items) {
    if (!isTextItem(item) || !item.str.trim()) {
      continue;
    }

    positioned.push({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
    });
  }

  positioned.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: string[] = [];
  let currentLine: PositionedTextItem[] = [];
  let currentY: number | null = null;

  for (const item of positioned) {
    if (
      currentY === null ||
      Math.abs(item.y - currentY) <= PDF_LINE_Y_TOLERANCE
    ) {
      currentLine.push(item);
      currentY ??= item.y;
      continue;
    }

    lines.push(
      currentLine
        .sort((a, b) => a.x - b.x)
        .map((entry) => entry.str)
        .join(" ")
        .replace(/[ \t]{2,}/g, " ")
        .trim(),
    );
    currentLine = [item];
    currentY = item.y;
  }

  if (currentLine.length > 0) {
    lines.push(
      currentLine
        .sort((a, b) => a.x - b.x)
        .map((entry) => entry.str)
        .join(" ")
        .replace(/[ \t]{2,}/g, " ")
        .trim(),
    );
  }

  return lines.filter(Boolean);
}

export function isSupportedResumeFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

export async function extractResumeText(file: File): Promise<string> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    return normalizeResumeLineBreaks(await file.text());
  }

  if (lowerName.endsWith(".docx")) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return normalizeResumeLineBreaks(result.value);
  }

  if (lowerName.endsWith(".pdf")) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageLines = groupPdfTextItemsIntoLines(content.items);
      pages.push(pageLines.join("\n"));
    }

    return normalizeResumeLineBreaks(pages.join("\n"));
  }

  throw new Error(
    "Unsupported file type. Please upload a .txt, .md, .docx, or .pdf file.",
  );
}

export const SUPPORTED_RESUME_FORMATS = "TXT, MD, DOCX, or PDF";
