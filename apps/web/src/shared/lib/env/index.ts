type Environment = "production" | "development";

export function getEnvironment(): Environment {
  return import.meta.env.MODE === "production" ? "production" : "development";
}

export const isProduction = getEnvironment() === "production";
