/**
 * Extract a URL through the real fallback chain and print the result.
 *
 * Set DEFUDDLE_API_KEY / FIRECRAWL_API_KEY to enable the hosted tiers; without
 * them only the local extractor runs.
 *
 * Usage:
 *   bun apps/api/scripts/extract.ts <url> [...url]
 */
import { createContentExtractor, ExtractionError } from "../src/services/extractor";

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error("Usage: bun apps/api/scripts/extract.ts <url> [...url]");
  process.exit(1);
}

const extractor = createContentExtractor();
let failed = 0;

for (const url of urls) {
  const startedAt = performance.now();
  try {
    const result = await extractor.extractUrl(url);
    const ms = Math.round(performance.now() - startedAt);
    console.log(`\n✓ ${url}  (${ms}ms)`);
    console.log(`  title  : ${result.metadata.title}`);
    console.log(`  author : ${result.metadata.author}`);
    console.log(`  chars  : ${result.markdown.length}`);
    console.log(`  preview: ${result.markdown.replace(/\s+/g, " ").slice(0, 100)}…`);
  } catch (error) {
    failed++;
    const ms = Math.round(performance.now() - startedAt);
    if (error instanceof ExtractionError) {
      console.log(`\n✗ ${url}  (${ms}ms)`);
      console.log(`  reason  : ${error.reason}${error.isTerminal ? " (terminal)" : ""}`);
      console.log(`  shown   : ${error.userMessage}`);
      console.log(`  detail  : ${error.message}`);
    } else {
      console.log(`\n✗ ${url}  (${ms}ms)\n  ${String(error)}`);
    }
  }
}

process.exit(failed > 0 ? 1 : 0);
