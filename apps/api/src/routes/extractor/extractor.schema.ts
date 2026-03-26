import { t } from "elysia";
import { baseResponseSchema } from "../../shared/schemas/api";

export const extractTextInputSchema = t.Object({
  textContent: t.String({ minLength: 1, maxLength: 1_000_000 }),
  kindleEmailId: t.Optional(t.String({ maxLength: 256 })),
});

export const extractUrlInputSchema = t.Object({
  url: t.String({ minLength: 1, maxLength: 2048 }),
  kindleEmailId: t.Optional(t.String({ maxLength: 256 })),
});

export const extractYoutubeInputSchema = t.Object({
  url: t.String({ minLength: 1, maxLength: 2048 }),
  kindleEmailId: t.Optional(t.String({ maxLength: 256 })),
});

export const extractTopicInputSchema = t.Object({
  topic: t.String({ minLength: 1, maxLength: 10_000 }),
  kindleEmailId: t.Optional(t.String({ maxLength: 256 })),
});

export const extractFileInputSchema = t.Object({
  file: t.File(),
  kindleEmailId: t.Optional(t.String()),
});

export const extractOutputSchema = baseResponseSchema(
  t.Object({
    markdown: t.String(),
    filename: t.String(),
    savedAt: t.String(),
  })
);

export const extractFileOutputSchema = baseResponseSchema(
  t.Object({
    filename: t.String(),
    sentAt: t.String(),
  })
);
