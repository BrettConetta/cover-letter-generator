import {
  PDFDocument,
  StandardFonts,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { FormatCoverLetterOptions } from "../../../lib/utils/formatCoverLetterDocument";
import {
  formatApplicantContactLine,
  formatApplicantLocation,
  formatCoverLetterDate,
  sanitizeCoverLetterBody,
} from "../../../lib/utils/formatCoverLetterDocument";

const PAGE_WIDTH = 612; // 8.5in
const PAGE_HEIGHT = 792; // 11in
const MARGIN = 72; // 1in
const FONT_SIZE = 11;
const LINE_HEIGHT = 13.2;
const SECTION_GAP = 12; // matches docx SECTION_SPACING (240 twips)
const BODY_PARAGRAPH_GAP = 10; // matches docx BODY_PARAGRAPH_SPACING (200 twips)

function sanitizeFilenamePart(companyName: string): string {
  const base = companyName.trim()
    ? `Cover Letter - ${companyName.trim()}`
    : "Cover Letter";

  return base.replace(/[<>:"/\\|?*]/g, "");
}

export function buildCoverLetterPdfFilename(companyName: string): string {
  return `${sanitizeFilenamePart(companyName)}.pdf`;
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = words[0];

  for (const word of words.slice(1)) {
    const candidate = `${currentLine} ${word}`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);
  return lines;
}

class CoverLetterPdfWriter {
  private y = PAGE_HEIGHT - MARGIN;
  private readonly maxWidth = PAGE_WIDTH - MARGIN * 2;
  private page: PDFPage;
  private readonly pdfDoc: PDFDocument;
  private readonly font: PDFFont;

  constructor(pdfDoc: PDFDocument, initialPage: PDFPage, font: PDFFont) {
    this.pdfDoc = pdfDoc;
    this.page = initialPage;
    this.font = font;
  }

  private ensureSpace(requiredHeight: number): void {
    if (this.y - requiredHeight >= MARGIN) {
      return;
    }

    this.page = this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private drawWrappedLine(text: string): void {
    this.ensureSpace(LINE_HEIGHT);
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y,
      size: FONT_SIZE,
      font: this.font,
    });
    this.y -= LINE_HEIGHT;
  }

  drawSingleLine(text: string, spacingAfter = 0): void {
    this.drawWrappedLine(text);
    this.y -= spacingAfter;
  }

  drawLines(lines: string[], spacingAfterLast = 0): void {
    lines.forEach((line, index) => {
      this.drawWrappedLine(line);
      if (index === lines.length - 1) {
        this.y -= spacingAfterLast;
      }
    });
  }

  drawParagraph(text: string, spacingAfter = BODY_PARAGRAPH_GAP): void {
    const wrapped = wrapText(text, this.font, FONT_SIZE, this.maxWidth);
    this.drawLines(wrapped, spacingAfter);
  }
}

export async function buildCoverLetterPdf(
  options: FormatCoverLetterOptions,
): Promise<Blob> {
  const {
    applicant,
    body,
    companyName = "",
    date = new Date(),
    recipient = "Hiring Manager",
  } = options;

  const sanitizedBody = sanitizeCoverLetterBody(body);
  const location = formatApplicantLocation(applicant);
  const contactLine = formatApplicantContactLine(applicant);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const writer = new CoverLetterPdfWriter(pdfDoc, page, font);

  const headerLines: string[] = [];
  if (applicant.fullName.trim()) {
    headerLines.push(applicant.fullName.trim());
  }
  if (location) {
    headerLines.push(location);
  }
  if (contactLine) {
    headerLines.push(contactLine);
  }

  writer.drawLines(headerLines, SECTION_GAP);
  writer.drawSingleLine(formatCoverLetterDate(date), SECTION_GAP);

  const recipientLines = [recipient];
  if (companyName.trim()) {
    recipientLines.push(companyName.trim());
  }

  writer.drawLines(recipientLines, SECTION_GAP);
  writer.drawSingleLine(`Dear ${recipient},`, SECTION_GAP);

  const bodyParagraphs = sanitizedBody
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  for (const paragraph of bodyParagraphs) {
    writer.drawParagraph(paragraph);
  }

  writer.drawSingleLine("Sincerely,");

  if (applicant.fullName.trim()) {
    writer.drawSingleLine(applicant.fullName.trim());
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([Uint8Array.from(pdfBytes)], { type: "application/pdf" });
}

export function downloadCoverLetterPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
