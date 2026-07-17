import type { ApplicantInfo } from "../schemas/applicant.js";

type FormatCoverLetterOptions = {
  applicant: ApplicantInfo;
  body: string;
  companyName?: string;
  date?: Date;
  recipient?: string;
};

export type { FormatCoverLetterOptions };

export function formatCoverLetterDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatApplicantLocation(applicant: ApplicantInfo): string {
  const { city, state, zip } = applicant;
  if (!city.trim() || !state.trim()) {
    return "";
  }

  return zip?.trim() ? `${city}, ${state} ${zip.trim()}` : `${city}, ${state}`;
}

export function formatApplicantContactLine(applicant: ApplicantInfo): string {
  const parts = [applicant.email.trim(), applicant.phone.trim()].filter(
    Boolean,
  );
  return parts.join(" | ");
}

/** Remove salutation or sign-off if the model added them anyway. */
export function sanitizeCoverLetterBody(body: string): string {
  return body
    .replace(/^Dear\s+.+?,?\s*(\n\n|\n)/i, "")
    .replace(/\n+(Sincerely|Best regards|Regards),?\s*\n+.+\s*$/i, "")
    .trim();
}

export function formatCoverLetterDocument({
  applicant,
  body,
  companyName = "",
  date = new Date(),
  recipient = "Hiring Manager",
}: FormatCoverLetterOptions): string {
  const sanitizedBody = sanitizeCoverLetterBody(body);
  const location = formatApplicantLocation(applicant);
  const contactLine = formatApplicantContactLine(applicant);

  const lines: string[] = [];

  if (applicant.fullName.trim()) {
    lines.push(applicant.fullName.trim());
  }
  if (location) {
    lines.push(location);
  }
  if (contactLine) {
    lines.push(contactLine);
  }

  lines.push("", formatCoverLetterDate(date), "", recipient);

  if (companyName.trim()) {
    lines.push(companyName.trim());
  }

  lines.push("", `Dear ${recipient},`, "", sanitizedBody, "", "Sincerely,");

  if (applicant.fullName.trim()) {
    lines.push(applicant.fullName.trim());
  }

  return lines.join("\n");
}
