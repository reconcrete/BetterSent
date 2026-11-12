type Environment = "production" | "development";

export function getEnvironment(): Environment {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export const isProduction = getEnvironment() === "production";

export { parseSignInOptions, SIGN_IN_OPTIONS, type SignInOption } from "./signInOptions";
import { parseSignInOptions } from "./signInOptions";

/** The sign-in methods this deployment offers — see signInOptions.ts. */
export const signInOptions = parseSignInOptions(process.env.SIGN_IN_OPTIONS, isProduction);
