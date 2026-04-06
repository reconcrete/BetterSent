/**
 * Scrape a URL using the Defuddle API and print the extracted content.
 *
 * Usage:
 *   DEFUDDLE_API_KEY=<key> bun apps/api/scripts/defuddle.ts <url>
 */

const url = process.argv[2];
if (!url) {
  console.error("Usage: bun apps/api/scripts/defuddle.ts <url>");
  process.exit(1);
}

const apiKey = process.env.DEFUDDLE_API_KEY;
if (!apiKey) {
  console.error("DEFUDDLE_API_KEY is required");
  process.exit(1);
}

const normalized = url.startsWith("http") ? url : `https://${url}`;

const response = await fetch(`https://defuddle.md/${normalized}`, {
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});

if (!response.ok) {
  console.error(`Defuddle API error: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const raw = await response.text();

if (!raw.trim()) {
  console.error("Defuddle returned empty content");
  process.exit(1);
}

console.log(raw);
