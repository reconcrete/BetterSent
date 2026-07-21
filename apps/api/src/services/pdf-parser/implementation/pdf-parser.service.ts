import { LiteParse } from "@llamaindex/liteparse";

const toMimeSubtype = (format: string): string => (format === "jpg" ? "jpeg" : format);

export class PdfParserService {
  async parseToMarkdown(fileBuffer: Buffer): Promise<string> {
    const parser = new LiteParse({
      outputFormat: "markdown",
      imageMode: "embed",
      ocrEnabled: false,
      quiet: true,
    });

    const result = await parser.parse(fileBuffer);

    let markdown = result.pages
      .map((page) => page.markdown.trim())
      .filter(Boolean)
      .join("\n\n");

    // LiteParse references embedded images as ![](image_<id>.png); inline them
    // as data URIs so Pandoc can embed them into the EPUB without extra files.
    for (const image of result.images) {
      const dataUri = `data:image/${toMimeSubtype(image.format)};base64,${image.bytes.toString("base64")}`;
      markdown = markdown
        .replaceAll(`(image_${image.id}.png)`, `(${dataUri})`)
        .replaceAll(`(image_${image.id}.${image.format})`, `(${dataUri})`);
    }

    if (!markdown.trim()) {
      throw new Error(
        "Could not extract readable text from this PDF. It may be scanned or image-only — try sending it as a PDF instead.",
      );
    }

    return markdown;
  }
}
