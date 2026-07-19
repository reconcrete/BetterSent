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

export const extractFileInputSchema = t.Object({
  file: t.File(),
  kindleEmailId: t.Optional(t.String()),
});

export const extractTestInputSchema = t.Object({
  kindleEmailId: t.Optional(t.String({ maxLength: 256 })),
});

export const extractAcceptedSchema = baseResponseSchema(
  t.Object({
    historyId: t.String(),
  })
);
