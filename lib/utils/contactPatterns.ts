export const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export const PHONE_PATTERN =
  /(?:\+?\d{1,3}[-.\s\u2013\u2014]*)?(?:\(?\d{3}\)?[-.\s\u2013\u2014]*){1,2}\d{4}/;

export const URL_PATTERN = /https?:\/\/\S+/i;

export const LINKEDIN_PATTERN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/\S+/i;

export const GITHUB_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+\/?/i;

export const PORTFOLIO_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?brettconetta\.dev\/?/i;

export const LOCATION_PATTERN =
  /^(.+?),\s*([A-Za-z]{2})(?:\s+(\d{5}(?:-\d{4})?))?\s*$/;

/** City/state at the start of a line that also contains phone, email, or links. */
export const LOCATION_PREFIX_PATTERN =
  /^(.+?),\s*([A-Za-z]{2})(?:\s+(\d{5}(?:-\d{4})?))?(?=\s)/;
