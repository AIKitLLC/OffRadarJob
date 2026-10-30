const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** International numbers that start with `+` and have grouped digits. */
const INTERNATIONAL_PHONE = /\+\d{1,3}(?:[\s.-]\d{1,5}){2,4}/g;

/**
 * NANP-style numbers with separators, optional leading `1`.
 * A bare digit run (a salary or a year) is left alone.
 */
const NANP_PHONE = /(?:\+?1[\s.-])?(?:\(\d{3}\)[\s.-]?|\b\d{3}[\s.-])\d{3}[\s.-]\d{4}\b/g;

/** Remove obvious emails and phone numbers from text that will leave the database in an export. */
export function redactExportedDescription(value: string): string {
  return value
    .replace(EMAIL, "[redacted-email]")
    .replace(INTERNATIONAL_PHONE, "[redacted-phone]")
    .replace(NANP_PHONE, "[redacted-phone]");
}
