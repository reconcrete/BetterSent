type Environment = "production" | "development";

export function getEnvironment(): Environment {
  return import.meta.env.MODE === "production" ? "production" : "development";
}

export const isProduction = getEnvironment() === "production";

export type SignInOption = "google" | "login" | "magiclink";
const KNOWN: readonly SignInOption[] = ["google", "login", "magiclink"];

/**
 * Sign-in methods offered on the sign-in page, in display order. Read from
 * VITE_SIGN_IN_OPTIONS ("google|login|magiclink") at build time; must match
 * SIGN_IN_OPTIONS on the API. Unset: "google" in production, "google|magiclink"
 * in development.
 */
export const signInOptions: SignInOption[] = (() => {
  const raw =
    import.meta.env.VITE_SIGN_IN_OPTIONS?.trim() ||
    (isProduction ? "google" : "google|magiclink");
  const parsed = raw
    .split(/[|,]/)
    .map((s: string) => s.trim().toLowerCase())
    .filter((s: string): s is SignInOption => {
      if (KNOWN.includes(s as SignInOption)) return true;
      if (s) console.warn(`VITE_SIGN_IN_OPTIONS: ignoring unknown option "${s}"`);
      return false;
    });
  return [...new Set(parsed)];
})();

export const magicLinkEnabled = signInOptions.includes("magiclink");
