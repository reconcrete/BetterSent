import { extractContent, saveEpub, scrapeUrl } from "../../services";

export const extractText = async (textContent: string) => {
  const markdown = await extractContent(textContent);
  const { filename, savedAt } = await saveEpub(markdown, "text");
  return { markdown, filename, savedAt };
};

export const extractUrl = async (url: string) => {
  const textContent = await scrapeUrl(url);

  const markdown = await extractContent(textContent);
  const { filename, savedAt } = await saveEpub(markdown, "url");
  return { markdown, filename, savedAt };
};
