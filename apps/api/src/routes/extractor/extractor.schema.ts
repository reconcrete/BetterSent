import { t } from "elysia";
import { baseResponseSchema } from "../../shared/schemas/api";

const bookDetailsFields = {
  title: t.Optional(t.String({ maxLength: 512 })),
  author: t.Optional(t.String({ maxLength: 256 })),
};

export const extractTextInputSchema = t.Object({
  textContent: t.String({ minLength: 1, maxLength: 1_000_000 }),
  kindleEmailId: t.Optional(t.String({ maxLength: 256 })),
  ...bookDetailsFields,
});

export const extractUrlInputSchema = t.Object({
  url: t.String({ minLength: 1, maxLength: 2048 }),
  kindleEmailId: t.Optional(t.String({ maxLength: 256 })),
  ...bookDetailsFields,
});

export const extractYoutubeInputSchema = t.Object({
  url: t.String({ minLength: 1, maxLength: 2048 }),
  kindleEmailId: t.Optional(t.String({ maxLength: 256 })),
  ...bookDetailsFields,
});

export const pdfConversionModes = ["original", "epub", "both"] as const;
export type PdfConversionMode = (typeof pdfConversionModes)[number];

export const extractFileInputSchema = t.Object({
  file: t.File(),
  kindleEmailId: t.Optional(t.String()),
  pdfConversion: t.Optional(
    t.Union([t.Literal("original"), t.Literal("epub"), t.Literal("both")])
  ),
  ...bookDetailsFields,
});

export const extractTestInputSchema = t.Object({
  kindleEmailId: t.Optional(t.String({ maxLength: 256 })),
});

export const extractAcceptedSchema = baseResponseSchema(
  t.Object({
    historyId: t.String(),
  })
);
