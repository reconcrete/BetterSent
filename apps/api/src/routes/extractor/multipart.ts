/**
 * Multipart form bodies cannot carry `undefined`. A client that spreads optional
 * fields into a FormData post (`{ file, kindleEmailId, title, author }` with some
 * of them unset) ends up sending the literal strings "undefined" or "null", and
 * the schema accepts those as ordinary strings. Downstream that surfaces as a
 * foreign-key failure on `kindle_email_id = 'undefined'` and as books arriving
 * on the device titled "undefined" by "undefined".
 *
 * Treat those placeholders (and empty strings) as absent so the defaults apply.
 */
const PLACEHOLDER_STRINGS = new Set(["", "undefined", "null"]);

export const dropPlaceholderStrings = <T extends Record<string, unknown>>(body: T): T => {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string" && PLACEHOLDER_STRINGS.has(value.trim())) continue;
    cleaned[key] = value;
  }
  return cleaned as T;
};
