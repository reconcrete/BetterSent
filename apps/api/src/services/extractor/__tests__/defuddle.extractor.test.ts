import { afterEach, describe, expect, test } from "bun:test";

import { DefuddleExtractor } from "../implementation/defuddle.extractor";
import { ExtractionError } from "../lib/errors";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function stubResponse(response: Response) {
  globalThis.fetch = (async () => response) as unknown as typeof fetch;
}

async function expectFailure(response: Response): Promise<ExtractionError> {
  stubResponse(response);
  const extractor = new DefuddleExtractor("test-key");
  try {
    await extractor.extractUrl("https://example.com/article");
  } catch (error) {
    return error as ExtractionError;
  }
  throw new Error("expected extractUrl to throw");
}

/**
 * Bodies below are verbatim from production defuddle.md responses. Every one
 * arrived as a bare `502 Bad Gateway`, which is what made the original failures
 * indistinguishable from each other.
 */
describe("DefuddleExtractor recovers the real reason from a 502", () => {
  const badGateway = (body: string) =>
    new Response(body, { status: 502, statusText: "Bad Gateway" });

  test("a bot-blocked page reports blocked, not upstream_error", async () => {
    const err = await expectFailure(badGateway('{"error":"Failed to fetch: 403 Forbidden"}'));
    expect(err.reason).toBe("blocked");
    expect(err.status).toBe(403);
    expect(err.isTerminal).toBe(false);
  });

  test("a throttled publisher reports rate_limited", async () => {
    const err = await expectFailure(badGateway('{"error":"Failed to fetch: 429 Too Many Requests"}'));
    expect(err.reason).toBe("rate_limited");
    expect(err.status).toBe(429);
  });

  test("a 401 from the target is a block, not our credentials", async () => {
    const err = await expectFailure(badGateway('{"error":"Failed to fetch: 401 Unauthorized"}'));
    expect(err.reason).toBe("blocked");
    expect(err.status).toBe(401);
  });

  test("a non-HTML URL is terminal so no paid tier is attempted", async () => {
    const err = await expectFailure(
      badGateway('{"error":"Not an HTML page (content-type: image/svg+xml)"}'),
    );
    expect(err.reason).toBe("unsupported_content");
    expect(err.isTerminal).toBe(true);
  });

  test("an unparseable body falls back to the outer status", async () => {
    const err = await expectFailure(badGateway("<html>gateway timeout</html>"));
    expect(err.reason).toBe("upstream_error");
  });
});

describe("DefuddleExtractor distinguishes its own failures from the target's", () => {
  test("a rejected API key is upstream_error, and stays non-terminal", async () => {
    const err = await expectFailure(new Response("Unauthorized", { status: 401, statusText: "Unauthorized" }));
    expect(err.reason).toBe("upstream_error");
    expect(err.isTerminal).toBe(false);
    expect(err.message).toContain("credentials");
  });

  test("an empty 200 body is empty_content", async () => {
    const err = await expectFailure(new Response("   ", { status: 200 }));
    expect(err.reason).toBe("empty_content");
  });
});

describe("DefuddleExtractor success path", () => {
  test("parses frontmatter into metadata", async () => {
    stubResponse(
      new Response(
        `---\ntitle: "Stop being the code review bottleneck"\nauthor: "Jina Yoon"\n---\n# Body\n\nText.`,
        { status: 200 },
      ),
    );

    const result = await new DefuddleExtractor("test-key").extractUrl("https://example.com/a");

    expect(result.metadata.title).toBe("Stop being the code review bottleneck");
    expect(result.metadata.author).toBe("Jina Yoon");
    expect(result.markdown).toBe("# Body\n\nText.");
    expect(result.needsLlmProcessing).toBe(false);
  });

  test("falls back to Untitled/Unknown when frontmatter is absent", async () => {
    stubResponse(new Response("just markdown", { status: 200 }));

    const result = await new DefuddleExtractor("test-key").extractUrl("https://example.com/a");

    expect(result.metadata).toEqual({ title: "Untitled", author: "Unknown" });
  });
});
