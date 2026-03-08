import { z } from "zod";

export const emailSchema = z.string().email("Please enter a valid email address.");

export const urlSchema = z.string().url("Please enter a valid URL.");

export const kindleEmailSchema = z
  .string()
  .email("Please enter a valid email address.")
  .refine(
    (email) => email.endsWith("@kindle.com") || email.endsWith("@free.kindle.com"),
    "Kindle email must end with @kindle.com or @free.kindle.com"
  );

export function isUrl(text: string): boolean {
  return urlSchema.safeParse(text).success;
}
