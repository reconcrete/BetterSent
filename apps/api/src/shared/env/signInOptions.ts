/**
 * SIGN_IN_OPTIONS — which sign-in methods this deployment offers, in the order
 * the sign-in page shows them. Values separated by "|" (or ","):
 *
 *   google     Google OAuth
 *   login      email + password (sign-up stays closed; passwords are set by an
 *              operator with apps/api/scripts/set-password.ts)
 *   magiclink  emailed sign-in link
 *
 * Unset: "google" in production, "google|magiclink" in development.
 * The web build reads the same list from VITE_SIGN_IN_OPTIONS; keep them equal.
 */
export const SIGN_IN_OPTIONS = ["google", "login", "magiclink"] as const;
export type SignInOption = (typeof SIGN_IN_OPTIONS)[number];

export function parseSignInOptions(raw: string | undefined, production: boolean): SignInOption[] {
  const value = raw?.trim() || (production ? "google" : "google|magiclink");
  const parsed = value
    .split(/[|,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const unknown = parsed.filter((s) => !(SIGN_IN_OPTIONS as readonly string[]).includes(s));
  if (unknown.length > 0) {
    throw new Error(
      `SIGN_IN_OPTIONS: unknown option(s) ${unknown.join(", ")} — expected ${SIGN_IN_OPTIONS.join("|")}`,
    );
  }
  if (parsed.length === 0) {
    throw new Error("SIGN_IN_OPTIONS: at least one sign-in option is required");
  }
  return [...new Set(parsed)] as SignInOption[];
}
