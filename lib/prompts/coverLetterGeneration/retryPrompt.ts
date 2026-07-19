export const COVER_LETTER_JSON_RETRY_PROMPT =
  "Your previous response was not valid JSON matching the required schema. " +
  "Return ONLY a single JSON object with the keys coverLetter (string) and companyName (string; empty string if the employer cannot be determined). " +
  "No markdown, no code fences, no extra text.";
