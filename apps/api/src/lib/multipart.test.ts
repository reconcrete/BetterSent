import { describe, expect, it } from "bun:test";

import { dropPlaceholderStrings } from "./multipart";

describe("dropPlaceholderStrings", () => {
  it("removes fields whose value is the string 'undefined', 'null' or empty", () => {
    const body: Record<string, string> = {
      file: "keep",
      kindleEmailId: "undefined",
      title: "null",
      author: "",
      pdfConversion: "  undefined ",
    };
    expect(dropPlaceholderStrings(body)).toEqual({ file: "keep" });
  });

  it("keeps real values and non-string values untouched", () => {
    const file = new File(["x"], "book.md");
    const body = { file, kindleEmailId: "abc-123", title: "Real Title", count: 0, flag: false };
    expect(dropPlaceholderStrings(body)).toEqual(body);
  });

  it("does not strip strings that merely contain a placeholder", () => {
    const body = { title: "undefined behaviour in C" };
    expect(dropPlaceholderStrings(body)).toEqual(body);
  });
});
