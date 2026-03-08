import type { Conversation } from "@grammyjs/conversations";
import { eq } from "@bettersent/db";
import { db, kindleEmailAddress } from "../db";
import { urlSchema } from "../utils/validators";
import { buildExtractionTypeKeyboard } from "../keyboards/extraction";
import { buildDeviceKeyboard } from "../keyboards/devices";
import { isCommand } from "../utils/conversation";
import * as apiClient from "../api/client";
import type { BotContext } from "../types/context";

export const EXTRACT_CONVERSATION = "extract";

export async function extractConversation(
  conversation: Conversation<BotContext, BotContext>,
  ctx: BotContext
) {
  const userId = await conversation.external((ctx) => ctx.session.userId!);
  const selectedDeviceId = await conversation.external((ctx) => ctx.session.selectedDeviceId);

  let deviceId = selectedDeviceId;

  if (!deviceId) {
    const devices = await conversation.external(() =>
      db.query.kindleEmailAddress.findMany({
        where: eq(kindleEmailAddress.userId, userId),
      })
    );

    if (devices.length === 0) {
      await ctx.reply("You don't have any devices yet. Use /add_device to add one first.");
      return;
    }

    await ctx.reply("Please select a device first:", {
      reply_markup: buildDeviceKeyboard(devices, undefined),
    });

    const callback = await conversation.waitForCallbackQuery(/^device_select:/);
    deviceId = callback.callbackQuery.data.split(":")[1];
    await conversation.external((ctx) => {
      ctx.session.selectedDeviceId = deviceId;
    });
    const selected = devices.find((d) => d.id === deviceId);
    await callback.editMessageText(`Selected: ${selected?.label || selected?.email}`);
  }

  await ctx.reply("What would you like to send to your Kindle?", {
    reply_markup: buildExtractionTypeKeyboard(),
  });

  const typeCallback = await conversation.waitForCallbackQuery([
    "extract_type:url",
    "extract_type:text",
    "extract_type:file",
  ]);

  const extractType = typeCallback.callbackQuery.data.split(":")[1];
  await typeCallback.editMessageText(`Selected: ${extractType.toUpperCase()}`);

  if (extractType === "url") {
    await ctx.reply("Send me the URL:");
    let url: string | undefined;

    while (!url) {
      const response = await conversation.waitFor("message:text");
      const text = response.message.text.trim();

      if (isCommand(text)) {
        await conversation.halt({ next: true });
      }

      const result = urlSchema.safeParse(text);
      if (!result.success) {
        await response.reply("That doesn't look like a valid URL. Please try again:");
        continue;
      }
      url = result.data;
    }

    await ctx.reply("⏳ Extracting content from URL...");
    const result = await conversation.external(() =>
      apiClient.extractUrl(url!, userId, deviceId)
    );

    if (result.success) {
      await ctx.reply(`✅ Sent to your Kindle!\n📄 ${result.data?.filename || "Document"}`);
    } else {
      await ctx.reply(`❌ Failed: ${result.error || "Unknown error"}`);
    }
  } else if (extractType === "text") {
    await ctx.reply("Send me the text content:");
    const response = await conversation.waitFor("message:text");
    const text = response.message.text;

    if (isCommand(text)) {
      await conversation.halt({ next: true });
    }

    await ctx.reply("⏳ Processing text...");
    const result = await conversation.external(() =>
      apiClient.extractText(text, userId, deviceId)
    );

    if (result.success) {
      await ctx.reply(`✅ Sent to your Kindle!\n📄 ${result.data?.filename || "Document"}`);
    } else {
      await ctx.reply(`❌ Failed: ${result.error || "Unknown error"}`);
    }
  } else if (extractType === "file") {
    await ctx.reply("Send me the file:");
    const response = await conversation.waitFor("message:document");
    const file = await response.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`;
    const fileResponse = await fetch(fileUrl);
    const arrayBuffer = await fileResponse.arrayBuffer();
    const fileName = response.message.document?.file_name || "document";

    await ctx.reply("⏳ Processing file...");
    const result = await conversation.external(() =>
      apiClient.extractFile(arrayBuffer, fileName, userId, deviceId)
    );

    if (result.success) {
      await ctx.reply(`✅ Sent to your Kindle!\n📄 ${result.data?.filename || fileName}`);
    } else {
      await ctx.reply(`❌ Failed: ${result.error || "Unknown error"}`);
    }
  }
}
