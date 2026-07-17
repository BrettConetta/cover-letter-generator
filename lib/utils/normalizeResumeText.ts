export function normalizeResumeLineBreaks(text: string): string {
  return (
    text
      // PDF page breaks often insert a blank line before the next bullet.
      .replace(/\n\n+(?=•\s)/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
