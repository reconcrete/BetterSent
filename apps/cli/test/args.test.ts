import { describe, expect, test } from "bun:test";

import { parseCliArgs } from "../src/lib/args";

describe("parseCliArgs", () => {
  test("parses each source flag", () => {
    expect(parseCliArgs(["--url", "https://example.com"])).toEqual({
      command: "send",
      source: { type: "url", value: "https://example.com" },
      chooseDevice: false,
    });

    expect(parseCliArgs(["--youtube", "https://youtu.be/abc"])).toEqual({
      command: "send",
      source: { type: "youtube", value: "https://youtu.be/abc" },
      chooseDevice: false,
    });

    expect(parseCliArgs(["--file", "./book.epub"])).toEqual({
      command: "send",
      source: { type: "file", value: "./book.epub" },
      chooseDevice: false,
    });
  });

  test("parses --choose-device alongside a source", () => {
    expect(parseCliArgs(["--url", "https://example.com", "--choose-device"])).toEqual({
      command: "send",
      source: { type: "url", value: "https://example.com" },
      chooseDevice: true,
    });
  });

  test("rejects more than one source", () => {
    const parsed = parseCliArgs(["--url", "https://example.com", "--file", "./a.pdf"]);
    expect(parsed.command).toBe("error");
  });

  test("rejects unknown flags and commands", () => {
    expect(parseCliArgs(["--topic", "space"]).command).toBe("error");
    expect(parseCliArgs(["publish"]).command).toBe("error");
  });

  test("parses subcommands", () => {
    expect(parseCliArgs(["login"])).toEqual({ command: "login" });
    expect(parseCliArgs(["logout"])).toEqual({ command: "logout" });
    expect(parseCliArgs(["setup"])).toEqual({ command: "setup" });
  });

  test("falls back to help", () => {
    expect(parseCliArgs([])).toEqual({ command: "help" });
    expect(parseCliArgs(["--help"])).toEqual({ command: "help" });
    expect(parseCliArgs(["-v"])).toEqual({ command: "version" });
  });
});
