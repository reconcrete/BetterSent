import fs from "fs";

import { extractContent, saveEpub, scrapeUrl } from "../../services";
import { EmailService } from "../../services/email";

export const extractText = async (textContent: string) => {
  const markdown = await extractContent(textContent);
  const { filename, path, savedAt } = await saveEpub(markdown, "text");

  const emailService = new EmailService();
  const attachmentContent = fs.readFileSync(path).toString("base64");
  await emailService.sendEmail(process.env.RESEND_TO_EMAIL as string, "", "", [
    { filename, content: attachmentContent },
  ]);

  return { markdown, filename, savedAt };
};

export const extractUrl = async (url: string) => {
  const textContent = await scrapeUrl(url);

  const markdown = await extractContent(textContent);
  const { filename, path, savedAt } = await saveEpub(markdown, "url");

  const emailService = new EmailService();
  const attachmentContent = fs.readFileSync(path).toString("base64");

  try {
    await emailService.sendEmail(process.env.RESEND_TO_EMAIL as string, "Extract URL", "This is a extract url email", [
      { filename: "Extracted Content.epub", content: attachmentContent },
    ]);
  } catch (error) {
    console.error("❌ Email error:", error);
  }

  return { markdown, filename, savedAt };
};
