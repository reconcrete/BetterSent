import { t } from "elysia";
import { baseResponseSchema } from "../../shared/schemas/api";

export const extractTextInputSchema = t.Object({
  textContent: t.String({ minLength: 1 }),
  kindleEmailId: t.Optional(t.String()),
});

export const extractUrlInputSchema = t.Object({
  url: t.String({ minLength: 1 }),
  kindleEmailId: t.Optional(t.String()),
});

export const extractOutputSchema = baseResponseSchema(
  t.Object({
    markdown: t.String(),
    filename: t.String(),
    savedAt: t.String(),
  })
);

// Provider-safe limit (25 MB) for email attachments
export const MAX_FILE_SIZE_MB = 25;
export const SUPPORTED_FILE_EXTENSIONS = [
  "pdf", "doc", "docx", "txt", "rtf", "htm", "html",
  "png", "gif", "jpg", "jpeg", "bmp", "epub",
] as const;

export const extractFileInputSchema = t.Object({
  file: t.File({ maxSize: "25m" }),
  kindleEmailId: t.Optional(t.String()),
});

export const extractFileOutputSchema = baseResponseSchema(
  t.Object({
    filename: t.String(),
    sentAt: t.String(),
  })
);
