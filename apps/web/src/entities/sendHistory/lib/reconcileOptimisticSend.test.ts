import { describe, expect, it } from "bun:test";

import type { HistoryItem } from "../types";
import { reconcileOptimisticSend } from "./reconcileOptimisticSend";

const makeItem = (id: string, overrides: Partial<HistoryItem> = {}): HistoryItem => ({
  id,
  type: "file",
  content: "book.epub",
  title: null,
  author: null,
  status: "processing",
  errorMessage: null,
  kindleLabel: null,
  hasPreview: false,
  references: [],
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
  ...overrides,
});

describe("reconcileOptimisticSend", () => {
  it("remaps the temp id to the real id when the server row is not in the cache", () => {
    const items = [makeItem("temp-1"), makeItem("other")];

    const result = reconcileOptimisticSend(items, "temp-1", "real-1");

    expect(result.map((item) => item.id)).toEqual(["real-1", "other"]);
  });

  it("drops the optimistic item when the websocket already inserted the real row", () => {
    // The ws push carries fresher data (e.g. extracted title) than the optimistic item
    const wsRow = makeItem("real-1", { title: "Extracted Title", status: "completed" });
    const items = [wsRow, makeItem("temp-1"), makeItem("other")];

    const result = reconcileOptimisticSend(items, "temp-1", "real-1");

    expect(result.map((item) => item.id)).toEqual(["real-1", "other"]);
    expect(result[0]).toEqual(wsRow);
  });

  it("only touches the matching temp item when multiple sends are in flight", () => {
    const items = [makeItem("temp-2"), makeItem("temp-1")];

    const result = reconcileOptimisticSend(items, "temp-1", "real-1");

    expect(result.map((item) => item.id)).toEqual(["temp-2", "real-1"]);
  });
});
