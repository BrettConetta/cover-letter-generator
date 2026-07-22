import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from "docx";
import type { FormatCoverLetterOptions } from "../../../lib/utils/formatCoverLetterDocument.js";
import {
  formatApplicantContactLine,
  formatApplicantLocation,
  formatCoverLetterDate,
  sanitizeCoverLetterBody,
} from "../../../lib/utils/formatCoverLetterDocument.js";

const FONT = "Calibri";
const BODY_FONT_SIZE = 22; // 11pt in half-points
const SECTION_SPACING = 240; // 12pt after major blocks
const BODY_PARAGRAPH_SPACING = 200; // 10pt after body paragraphs

type TextParagraphOptions = {
  bold?: boolean;
  size?: number;
  spacingAfter?: number;
};

function textParagraph(
  text: string,
  options: TextParagraphOptions = {},
): Paragraph {
  return new Paragraph({
    spacing: { after: options.spacingAfter ?? 0 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: options.size ?? BODY_FONT_SIZE,
        bold: options.bold,
      }),
    ],
  });
}

function bodyParagraph(text: string): Paragraph {
  return textParagraph(text, { spacingAfter: BODY_PARAGRAPH_SPACING });
}

function pushLines(
  paragraphs: Paragraph[],
  lines: string[],
  spacingAfterLast = 0,
): void {
  lines.forEach((text, index) => {
    const isLast = index === lines.length - 1;
    paragraphs.push(
      textParagraph(text, {
        spacingAfter: isLast ? spacingAfterLast : 0,
      }),
    );
  });
}

export function buildCoverLetterFilename(companyName: string): string {
  const base = companyName.trim()
    ? `Cover Letter - ${companyName.trim()}`
    : "Cover Letter";

  return `${base.replace(/[<>:"/\\|?*]/g, "")}.docx`;
}

export async function buildCoverLetterDocx(
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
  const paragraphs: Paragraph[] = [];

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

  pushLines(paragraphs, headerLines, SECTION_SPACING);

  paragraphs.push(
    textParagraph(formatCoverLetterDate(date), {
      spacingAfter: SECTION_SPACING,
    }),
  );

  const recipientLines = [recipient];
  if (companyName.trim()) {
    recipientLines.push(companyName.trim());
  }

  pushLines(paragraphs, recipientLines, SECTION_SPACING);

  paragraphs.push(
    textParagraph(`Dear ${recipient},`, { spacingAfter: SECTION_SPACING }),
  );

  const bodyParagraphs = sanitizedBody
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  for (const paragraph of bodyParagraphs) {
    paragraphs.push(bodyParagraph(paragraph));
  }

  paragraphs.push(textParagraph("Sincerely,", { spacingAfter: 0 }));

  if (applicant.fullName.trim()) {
    paragraphs.push(textParagraph(applicant.fullName.trim()));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export function downloadCoverLetterDocx(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
