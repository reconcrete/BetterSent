import { t } from "elysia";

export const historyItemSchema = t.Object({
  id: t.String(),
  type: t.Union([t.Literal("url"), t.Literal("text"), t.Literal("file"), t.Literal("youtube"), t.Literal("topic")]),
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
  kindleLabel: t.Nullable(t.String()),
  hasPreview: t.Boolean(),
  references: t.Array(t.Object({ url: t.String(), title: t.Nullable(t.String()) })),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export const historyListQuerySchema = t.Object({
  page: t.Numeric({ minimum: 1, default: 1 }),
  pageSize: t.Numeric({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE }),
});

export const historyListOutputSchema = {
  200: t.Object({
    success: t.Literal(true),
    data: t.Object({
      items: t.Array(historyItemSchema),
      page: t.Number(),
      pageSize: t.Number(),
      total: t.Number(),
      totalPages: t.Number(),
    }),
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
