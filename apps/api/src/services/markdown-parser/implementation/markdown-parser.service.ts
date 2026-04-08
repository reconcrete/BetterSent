import type { ParsedLink } from "../types";

const MARKDOWN_LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;

export class MarkdownParserService {
  parseLinks(markdown: string): ParsedLink[] {
    const seen = new Set<string>();
    const links: ParsedLink[] = [];

    for (const line of markdown.split("\n")) {
      if (line.trimStart().startsWith("![")) continue;

      for (const match of line.matchAll(MARKDOWN_LINK_REGEX)) {
        const title = match[1].trim();
        const url = match[2].trim();

        if (!url.startsWith("http://") && !url.startsWith("https://")) continue;
        if (seen.has(url)) continue;

        seen.add(url);
        links.push({ url, title: title || url });
      }
    }

    return links;
  }
}
