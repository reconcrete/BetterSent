/**
 * HTML Scraper Service
 * Fetches URLs and extracts text content from HTML
 */

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DEFAULT_ACCEPT_HEADER = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const JINA_READER_BASE_URL = process.env.JINA_READER_BASE_URL ?? "https://r.jina.ai/";

function ensureHttpUrl(url: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }

  return parsed;
}

function buildJinaReaderUrl(url: string): string {
  const base = JINA_READER_BASE_URL.endsWith("/")
    ? JINA_READER_BASE_URL
    : `${JINA_READER_BASE_URL}/`;
  return `${base}${url}`;
}

function parseJinaReaderBody(body: string): string {
  const marker = "Markdown Content:";
  const markerIndex = body.indexOf(marker);

  if (markerIndex === -1) {
    return body.trim();
  }

  return body.slice(markerIndex + marker.length).trim();
}

async function fetchViaJinaReader(url: string): Promise<string> {
const jinaUrl = buildJinaReaderUrl(url);
  const attempts: Array<Record<string, string>> = [
    {
      Accept: "text/markdown,text/plain;q=0.9,*/*;q=0.8",
      "X-Respond-With": "markdown",
      "X-Retain-Images": "all",
    },
    {
      Accept: "text/markdown,text/plain;q=0.9,*/*;q=0.8",
    },
  ];
  const errors: string[] = [];

  for (const headers of attempts) {
    try {
      const response = await fetch(jinaUrl, { headers });
      if (!response.ok) {
        errors.push(`${response.status} ${response.statusText}`);
        continue;
      }

      const rawBody = await response.text();
      const content = parseJinaReaderBody(rawBody);
      if (!content) {
        errors.push("empty body");
        continue;
      }

      return content;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "unknown error");
    }
  }

  throw new Error(`Jina Reader failed: ${errors.join(" | ")}`);
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
      Accept: DEFAULT_ACCEPT_HEADER,
    },
  });

  if (!response.ok) {
    throw new Error(`Direct fetch failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  if (!html.trim()) {
    throw new Error("Direct fetch returned empty response body");
  }

  return html;
}

/**
 * Fetches a URL and extracts text content from the HTML
 */
export async function scrapeUrl(url: string): Promise<string> {
  const parsedUrl = ensureHttpUrl(url);
  const scrapeErrors: string[] = [];

  try {
    return await fetchViaJinaReader(parsedUrl.toString());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Jina Reader error";
    scrapeErrors.push(message);
  }

  try {
    const html = await fetchHtml(parsedUrl.toString());
    return extractTextFromHtml(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown direct fetch error";
    scrapeErrors.push(message);
  }

  throw new Error(`Failed to scrape URL: ${scrapeErrors.join(" | ")}`);
}

/**
 * Extracts readable text content from HTML
 * Strips tags, scripts, styles, and normalizes whitespace
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style elements entirely
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, " ");

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");

  // Normalize whitespace: collapse multiple spaces/newlines into single space
  text = text.replace(/\s+/g, " ");

  // Trim and return
  return text.trim();
}

