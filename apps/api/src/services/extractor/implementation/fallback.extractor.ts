import { log } from "../../../lib/logger";
import type { ContentExtractor, ExtractedUrlContent } from "../types";
import { ExtractionError, toExtractionError } from "../lib/errors";

export interface ExtractorTier {
  name: string;
  extractor: ContentExtractor;
}

/**
 * Tries extractors in order until one produces content.
 *
 * Each tier fails for different reasons — a shared-IP rate limit, a bot block,
 * a JS-rendered page — so a later tier routinely succeeds where an earlier one
 * cannot. Terminal failures (an image URL, a private address) stop the chain
 * immediately rather than burning a paid tier on a request that cannot work.
 */
export class FallbackExtractor implements ContentExtractor {
  constructor(private readonly tiers: ExtractorTier[]) {
    if (tiers.length === 0) {
      throw new Error("FallbackExtractor requires at least one tier");
    }
  }

  async extractUrl(url: string): Promise<ExtractedUrlContent> {
    const failures: ExtractionError[] = [];

    for (const [index, tier] of this.tiers.entries()) {
      try {
        const result = await tier.extractor.extractUrl(url);
        if (index > 0) {
          log.info({ tier: tier.name, attempts: index + 1 }, "Extraction recovered by fallback tier");
        }
        return result;
      } catch (error) {
        const failure = toExtractionError(error, tier.name);
        failures.push(failure);

        if (failure.isTerminal) {
          log.info(
            { tier: tier.name, reason: failure.reason },
            "Extraction stopped: no other tier can succeed",
          );
          throw failure;
        }

        log.warn(
          { tier: tier.name, reason: failure.reason, status: failure.status, err: failure },
          "Extraction tier failed, trying next",
        );
      }
    }

    throw mostActionable(failures);
  }
}

/**
 * Surface the failure a user can act on. "Site blocks bots" is worth showing;
 * "unknown" from a later tier would bury it.
 */
function mostActionable(failures: ExtractionError[]): ExtractionError {
  return failures.reduce((best, candidate) => (candidate.priority > best.priority ? candidate : best));
}
