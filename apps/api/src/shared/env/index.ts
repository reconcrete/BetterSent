type Environment = "production" | "development";

export function getEnvironment(): Environment {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export const isProduction = getEnvironment() === "production";
