import { t } from "elysia";

export const historyItemSchema = t.Object({
  id: t.String(),
  type: t.Union([t.Literal("url"), t.Literal("text"), t.Literal("file"), t.Literal("youtube")]),
  content: t.String(),
  title: t.Nullable(t.String()),
  author: t.Nullable(t.String()),
  status: t.Union([
    t.Literal("pending"),
    t.Literal("processing"),
    t.Literal("completed"),
    t.Literal("error"),
  ]),
  errorMessage: t.Nullable(t.String()),
  kindleEmail: t.Nullable(t.String()),
  hasPreview: t.Boolean(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const historyArrayOutputSchema = {
  200: t.Object({
    success: t.Literal(true),
    data: t.Array(historyItemSchema),
  }),
  500: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
};

export const previewOutputSchema = {
  200: t.Object({
    success: t.Literal(true),
    data: t.Object({
      content: t.String(),
    }),
  }),
  404: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
  500: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
};
