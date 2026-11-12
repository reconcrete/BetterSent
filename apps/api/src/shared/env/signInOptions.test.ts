import { describe, expect, test } from "bun:test";

import { parseSignInOptions } from "./signInOptions";

describe("parseSignInOptions", () => {
  test("defaults depend on the environment", () => {
    expect(parseSignInOptions(undefined, true)).toEqual(["google"]);
    expect(parseSignInOptions("", false)).toEqual(["google", "magiclink"]);
  });

  test("keeps the given order, trims, lowercases and dedupes", () => {
    expect(parseSignInOptions(" Login | google,login ", true)).toEqual(["login", "google"]);
  });

  test("rejects unknown options", () => {
    expect(() => parseSignInOptions("google|password", true)).toThrow("password");
  });
});
