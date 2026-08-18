type Environment = "production" | "development";

export function getEnvironment(): Environment {
  return import.meta.env.MODE === "production" ? "production" : "development";
}

export const isProduction = getEnvironment() === "production";

/**
 * Magic-link sign-in is available in development, and in production builds only
 * when VITE_ENABLE_MAGIC_LINK is set. It must match ENABLE_MAGIC_LINK on the API.
 */
export const magicLinkEnabled =
  !isProduction || import.meta.env.VITE_ENABLE_MAGIC_LINK === "1";
