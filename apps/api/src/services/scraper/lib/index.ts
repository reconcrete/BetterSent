import { DEFAULT_ACCEPT_HEADER, DEFAULT_USER_AGENT } from "../constants";

const PRIVATE_IP_PATTERNS = [
  /^127\./, // loopback
  /^0\./, // "this" network
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^169\.254\./, // link-local (AWS/GCP metadata)
  /^(localhost|0\.0\.0\.0|::1?|fc00|fd|fe80)/i, // localhost, IPv6 private
];

export function isPrivateHost(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((p) => p.test(hostname));
}

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

  if (isPrivateHost(parsed.hostname)) {
    throw new Error("Access to private/internal addresses is not allowed");
  }

  return parsed;
}

export async function fetchHtml(url: string): Promise<string> {
  ensureHttpUrl(url);

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
