import { afterEach, describe, expect, test } from "bun:test";

import { ExtractionError } from "../lib/errors";
import { fetchPage } from "../lib/fetch-page";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Serve a canned response per requested URL, recording the request order. */
function stubRoutes(routes: Record<string, Response>, seen: string[] = []) {
  globalThis.fetch = (async (input: string | URL) => {
    const url = input.toString();
    seen.push(url);
    const response = routes[url];
    if (!response) throw new Error(`unexpected fetch: ${url}`);
    return response;
  }) as unknown as typeof fetch;
  return seen;
}

const html = (body: string) => new Response(body, { headers: { "content-type": "text/html" } });

async function failureOf(promise: Promise<unknown>): Promise<ExtractionError> {
  try {
    await promise;
  } catch (error) {
    return error as ExtractionError;
  }
  throw new Error("expected fetchPage to throw");
}

describe("fetchPage URL validation", () => {
  test("rejects a non-http protocol as invalid, before any request", async () => {
    const err = await failureOf(fetchPage("file:///etc/passwd"));
    expect(err.reason).toBe("invalid_url");
  });

  test("rejects the cloud metadata address", async () => {
    const err = await failureOf(fetchPage("http://169.254.169.254/latest/meta-data/"));
    expect(err.reason).toBe("private_host");
  });

  test("rejects loopback", async () => {
    const err = await failureOf(fetchPage("http://127.0.0.1:8080/admin"));
    expect(err.reason).toBe("private_host");
  });
});

describe("fetchPage redirect handling", () => {
  test("follows a public redirect and reports the final URL", async () => {
    stubRoutes({
      "https://example.com/a": new Response(null, {
        status: 301,
        headers: { location: "https://example.com/b" },
      }),
      "https://example.com/b": html("<html><body>hi</body></html>"),
    });

    const page = await fetchPage("https://example.com/a");
    expect(page.finalUrl).toBe("https://example.com/b");
    expect(page.html).toContain("hi");
  });

  test("resolves a relative Location against the current URL", async () => {
    stubRoutes({
      "https://example.com/a": new Response(null, {
        status: 302,
        headers: { location: "/b" },
      }),
      "https://example.com/b": html("<html>ok</html>"),
    });

    expect((await fetchPage("https://example.com/a")).finalUrl).toBe("https://example.com/b");
  });

  test("a public URL cannot redirect into the private network", async () => {
    const seen = stubRoutes({
      "https://evil.example.com/": new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/latest/meta-data/" },
      }),
    });

    const err = await failureOf(fetchPage("https://evil.example.com/"));
    expect(err.reason).toBe("private_host");
    expect(seen).toEqual(["https://evil.example.com/"]);
  });

  test("gives up after too many redirects", async () => {
    globalThis.fetch = (async (input: string | URL) =>
      new Response(null, { status: 302, headers: { location: input.toString() } })) as unknown as typeof fetch;

    const err = await failureOf(fetchPage("https://example.com/loop"));
    expect(err.reason).toBe("upstream_error");
    expect(err.message).toMatch(/redirects/);
  });
});

describe("fetchPage response guards", () => {
  test("maps target status onto a reason", async () => {
    stubRoutes({ "https://example.com/": new Response("no", { status: 403, statusText: "Forbidden" }) });
    expect((await failureOf(fetchPage("https://example.com/"))).reason).toBe("blocked");
  });

  test("rejects a non-HTML content type — the .svg case", async () => {
    stubRoutes({
      "https://example.com/logo.svg": new Response("<svg/>", {
        headers: { "content-type": "image/svg+xml" },
      }),
    });

    const err = await failureOf(fetchPage("https://example.com/logo.svg"));
    expect(err.reason).toBe("unsupported_content");
    expect(err.isTerminal).toBe(true);
  });

  test("accepts a charset-qualified html content type", async () => {
    stubRoutes({
      "https://example.com/": new Response("<html>ok</html>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    });
    expect((await fetchPage("https://example.com/")).html).toContain("ok");
  });

  test("refuses a body larger than the cap via content-length", async () => {
    stubRoutes({
      "https://example.com/": new Response("<html>x</html>", {
        headers: { "content-type": "text/html", "content-length": String(50 * 1024 * 1024) },
      }),
    });
    expect((await failureOf(fetchPage("https://example.com/"))).reason).toBe("too_large");
  });

  test("refuses an oversized body that lies about its length", async () => {
    stubRoutes({
      "https://example.com/": new Response("x".repeat(5000), { headers: { "content-type": "text/html" } }),
    });

    const err = await failureOf(fetchPage("https://example.com/", { maxBytes: 1000 }));
    expect(err.reason).toBe("too_large");
  });

  test("treats an empty body as empty_content", async () => {
    stubRoutes({ "https://example.com/": html("   ") });
    expect((await failureOf(fetchPage("https://example.com/"))).reason).toBe("empty_content");
  });
});
