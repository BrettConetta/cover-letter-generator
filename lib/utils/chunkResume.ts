import { ResumeChunk } from "../schemas/resumeChunk.js";
import { normalizeResumeLineBreaks } from "./normalizeResumeText.js";

const SECTION_ALIASES: Record<string, string> = {
  summary: "summary",
  "professional summary": "summary",
  experience: "experience",
  "work experience": "experience",
  education: "education",
  skills: "skills",
  "technical skills": "skills",
  projects: "projects",
};

const SECTION_HEADER_LINE =
  /^(?:Summary|Experience|Education|Skills|Projects|Work Experience|Technical Skills|Professional Summary)\s*$/i;
const COMPANY_LINE = /^.+\s•\s+[^,]+,\s*[A-Za-z]{2}\s*$/;
const PROJECT_LINE = /^.+\s•\s+.+$/;

function normalizeSection(header: string): string {
  const key = header.trim().toLowerCase();
  return SECTION_ALIASES[key] ?? key; // fallback if you add new headers later
}

function isHeader(line: string, headerRegex: RegExp): boolean {
  return headerRegex.test(line.trim());
}

export function chunkResume(resume: string): ResumeChunk[] {
  const sections = chunkResumeIntoSections(resume);
  const chunkedSections = sections.flatMap((section) => {
    if (section.section === "experience") {
      return chunkResumeSectionIntoEntries(section, COMPANY_LINE);
    }
    if (section.section === "projects") {
      return chunkResumeSectionIntoEntries(section, PROJECT_LINE, true);
    }
    return section;
  });
  return chunkedSections;
}

export function chunkResumeIntoSections(resume: string): ResumeChunk[] {
  const resumeLines = normalizeResumeLineBreaks(resume).split("\n");

  let sectionHeader: string | null = null;
  let sectionText: string[] = [];

  const sections: ResumeChunk[] = [];

  // pushes the sectionHeader and sectionText into sections as long as there is a sectionHeader
  // sectionHeader wont be set the first time a section header is found
  const flush = () => {
    if (sectionHeader === null) return;
    sections.push({
      id: sectionHeader,
      section: sectionHeader,
      text: sectionText.join("\n"),
    });
    sectionText = [];
  };

  // loop through the lines, adding a new entry to sections when the next header is found
  // because of the if in flush(), nothing happens when the first section header is found
  // pushes the current line to sectionText if it isn't a section header
  for (const line of resumeLines) {
    if (isHeader(line, SECTION_HEADER_LINE)) {
      flush();
      // set the sectionHeader to the current line (the next section header)
      sectionHeader = normalizeSection(line);
      continue;
    }

    // handles the contact info at the top of the resume before a sectionHeader is found
    if (sectionHeader === null) {
      continue;
    }

    // add the line to the sectionText
    sectionText.push(line);
  }

  // push the last sectionHeader and sectionText into sections
  flush();

  return sections;
}

export function chunkResumeSectionIntoEntries(
  section: ResumeChunk,
  newEntryRegex: RegExp,
  prependPreviousLine: boolean = false,
): ResumeChunk[] {
  const entries: ResumeChunk[] = [];
  const sectionLines = section.text.split("\n");

  let entryText: string[] = [];
  let entryHeader: string | null = null;
  let previousLine: string | null = null;
  let iteration = 0;

  const flush = () => {
    if (entryHeader === null) return;
    entries.push({
      id: `${section.section}-${iteration++}`,
      section: section.section,
      text: entryText.join("\n"),
    });
    entryText = [];
  };

  for (const line of sectionLines) {
    if (isHeader(line, newEntryRegex)) {
      // pull next title off the current entry (if it was already pushed)
      if (
        prependPreviousLine &&
        previousLine?.trim() &&
        !previousLine.trim().startsWith("•") &&
        entryText.length > 0 &&
        entryText[entryText.length - 1] === previousLine
      ) {
        entryText.pop();
      }

      // push the current entry to the entries array
      flush();
      entryHeader = line.trim();

      // start new entry with that title + this header line
      if (
        prependPreviousLine &&
        previousLine?.trim() &&
        !previousLine.trim().startsWith("•")
      ) {
        entryText.push(previousLine);
      }

      // add the current line to the entryText
      entryText.push(line);
    } else if (entryHeader === null) {
      // waiting for first entry header — title may sit here for projects
    } else {
      // add the current line to the entryText
      entryText.push(line);
    }

    // set the previous line to the current line
    previousLine = line;
  }

  // push the last sectionHeader and sectionText into sections
  flush();

  return entries;
}
