/**
 * Multipart bodies cannot carry `undefined` — a client that spreads unset optional
 * fields into a FormData post sends the literal strings "undefined"/"null" instead.
 * Treat those (and empty strings) as absent so the defaults apply.
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
