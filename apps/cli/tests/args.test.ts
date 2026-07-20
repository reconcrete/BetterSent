import { describe, expect, test } from "bun:test";

import { parse, UsageError } from "../src/args";

describe("parse", () => {
  test("subcommands", () => {
    expect(parse(["login"])).toEqual({ command: "login" });
    expect(parse(["logout"])).toEqual({ command: "logout" });
    expect(parse(["setup"])).toEqual({ command: "setup" });
  });

  test("send flags", () => {
    expect(parse(["--url", "https://example.com"])).toEqual({
      command: "send",
      kind: "url",
      target: "https://example.com",
      chooseDevice: false,
    });
    expect(parse(["--file", "./book.epub", "--choose-device"])).toEqual({
      command: "send",
      kind: "file",
      target: "./book.epub",
      chooseDevice: true,
    });
    expect(parse(["--youtube", "https://youtu.be/abc"])).toEqual({
      command: "send",
      kind: "youtube",
      target: "https://youtu.be/abc",
      chooseDevice: false,
    });
  });

  test("help and version", () => {
    expect(parse([])).toEqual({ command: "help" });
    expect(parse(["--help"])).toEqual({ command: "help" });
    expect(parse(["-h"])).toEqual({ command: "help" });
    expect(parse(["--version"])).toEqual({ command: "version" });
    expect(parse(["-v"])).toEqual({ command: "version" });
  });

  test("rejects multiple send flags", () => {
    expect(() => parse(["--url", "a", "--file", "b"])).toThrow(UsageError);
  });

  test("rejects unknown subcommands and options", () => {
    expect(() => parse(["deploy"])).toThrow(UsageError);
    expect(() => parse(["--frobnicate"])).toThrow(UsageError);
  });

  test("rejects subcommands combined with send flags", () => {
    expect(() => parse(["login", "--url", "a"])).toThrow(UsageError);
    expect(() => parse(["login", "extra"])).toThrow(UsageError);
  });

  test("rejects --choose-device on its own", () => {
    expect(() => parse(["--choose-device"])).toThrow(UsageError);
  });

  test("rejects empty flag values", () => {
    expect(() => parse(["--url", "  "])).toThrow(UsageError);
  });
});
