/** Inline image syntax: ![alt](url) */
export const INLINE_IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;

/**
 * Scripts we can detect cheaply from the content itself. Pandoc writes the
 * result into <dc:language>/xml:lang, which is what e-readers use to pick a
 * hyphenation dictionary. With the wrong tag they justify without
 * hyphenating, which opens large gaps between words.
 */
export const LANGUAGE_PATTERNS: ReadonlyArray<{ lang: string; re: RegExp }> = [
  { lang: "ru", re: /[Ѐ-ӿ]/g },
  { lang: "el", re: /[Ͱ-Ͽ]/g },
  { lang: "he", re: /[֐-׿]/g },
  { lang: "ar", re: /[؀-ۿ]/g },
  { lang: "ja", re: /[぀-ヿ]/g },
  { lang: "ko", re: /[가-힯]/g },
  { lang: "zh", re: /[一-鿿]/g },
];

export const DEFAULT_LANGUAGE = "en-US";

/**
 * Share of characters that must belong to a script before we treat the whole
 * document as being in it, rather than as English quoting a few foreign words.
 */
export const LANGUAGE_DETECTION_THRESHOLD = 0.2;

/**
 * Appended to pandoc's default EPUB stylesheet. Pandoc only sets
 * `hyphens: manual` on <code> and leaves body text to the reader's defaults;
 * Kindle justifies by default, so without this the text is justified but
 * never hyphenated.
 */
export const EPUB_HYPHENATION_CSS = `
/* bettersent: enable automatic hyphenation for justified body text */
body, p, li, blockquote, dd, dt {
  -webkit-hyphens: auto;
  -epub-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
  hyphens: auto;
  adobe-hyphenate: auto;
}
/* never hyphenate content that must stay verbatim */
code, pre, pre code, kbd, samp, var {
  -webkit-hyphens: none;
  -epub-hyphens: none;
  -moz-hyphens: none;
  -ms-hyphens: none;
  hyphens: none;
  adobe-hyphenate: none;
}
`;
