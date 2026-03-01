import { DEFAULT_ACCEPT_HEADER, DEFAULT_USER_AGENT } from "../constants";

export function ensureHttpUrl(url: string): URL {
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

export function buildJinaReaderUrl(baseUrl: string, url: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}${url}`;
}

export function parseJinaReaderBody(body: string): string {
  const marker = "Markdown Content:";
  const markerIndex = body.indexOf(marker);

  if (markerIndex === -1) {
    return body.trim();
  }

  return body.slice(markerIndex + marker.length).trim();
}

export async function fetchViaJinaReader(jinaBaseUrl: string, url: string): Promise<string> {
  const jinaUrl = buildJinaReaderUrl(jinaBaseUrl, url);
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

export async function fetchHtml(url: string): Promise<string> {
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

export function extractTextFromHtml(html: string): string {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");
  text = text.replace(/\s+/g, " ");
  return text.trim();
}
