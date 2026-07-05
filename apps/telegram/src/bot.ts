import { Bot } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { BOT_TOKEN } from "./config";
import type { BotContext } from "./types/context";
import { sessionMiddleware } from "./middleware/session";
import { authGuard } from "./middleware/auth";

// Conversations
import { authConversation, AUTH_CONVERSATION } from "./conversations/auth";
import { addDeviceConversation, ADD_DEVICE_CONVERSATION } from "./conversations/add-device";
import { extractConversation, EXTRACT_CONVERSATION } from "./conversations/extract";

// Commands
import { startCommand } from "./commands/start";
import { helpCommand } from "./commands/help";
import { deviceCommand } from "./commands/device";
import { addDeviceCommand } from "./commands/add-device";
import { extractCommand } from "./commands/extract";
import { logoutCommand } from "./commands/logout";
import { meCommand } from "./commands/me";

// Helpers
import { db, kindleEmailAddress } from "./db";
import { eq, and } from "@bettersent/db";
import { isUrl } from "./utils/validators";
import { buildConfirmKeyboard } from "./keyboards/extraction";
import * as apiClient from "./api/client";

export const bot = new Bot<BotContext>(BOT_TOKEN);

// --- Middleware ---
bot.use(sessionMiddleware());
bot.use(conversations());

// --- Register conversations (before auth guard so active conversations receive messages) ---
bot.use(createConversation(authConversation, AUTH_CONVERSATION));
bot.use(createConversation(addDeviceConversation, ADD_DEVICE_CONVERSATION));
bot.use(createConversation(extractConversation, EXTRACT_CONVERSATION));

// --- Auth guard (after conversations so active conversations aren't blocked) ---
bot.use(authGuard);

// --- Commands ---
bot.command("start", startCommand);
bot.command("help", helpCommand);
bot.command("device", deviceCommand);
bot.command("add_device", addDeviceCommand);
bot.command("extract", extractCommand);
bot.command("logout", logoutCommand);
bot.command("me", meCommand);

// --- Callback queries ---
bot.callbackQuery(/^device_select:/, async (ctx) => {
  const deviceId = ctx.callbackQuery.data.split(":")[1];
  ctx.session.selectedDeviceId = deviceId;

  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery({ text: "Please login first." });
    return;
  }

  const device = await db.query.kindleEmailAddress.findFirst({
    where: and(eq(kindleEmailAddress.id, deviceId), eq(kindleEmailAddress.userId, ctx.session.userId)),
  });

  await ctx.editMessageText(`✅ Selected: ${device?.label || device?.email || "device"}`);
  await ctx.answerCallbackQuery();
});

bot.callbackQuery("device_add_new", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter(ADD_DEVICE_CONVERSATION);
});

// Resolve the session's selected device, clearing it if it no longer exists
// (e.g. deleted from the web app) so we re-prompt instead of sending a stale id
// that the API would reject with "No Kindle email configured".
async function getValidSelectedDevice(ctx: BotContext) {
  const { userId, selectedDeviceId } = ctx.session;
  if (!userId || !selectedDeviceId) return null;

  const device = await db.query.kindleEmailAddress.findFirst({
    where: and(eq(kindleEmailAddress.id, selectedDeviceId), eq(kindleEmailAddress.userId, userId)),
  });

  if (!device) {
    ctx.session.selectedDeviceId = undefined;
    return null;
  }

  return device;
}

// --- Fallback: auto-detect URL/text/file ---
bot.on("message:text", async (ctx) => {
  if (!ctx.session.userId) return;

  const text = ctx.message.text;
  const device = await getValidSelectedDevice(ctx);

  if (!device) {
    await ctx.reply("Please select a device first. Use /device to choose one.");
    return;
  }

  if (isUrl(text)) {
    await ctx.reply(`Send this URL to your Kindle?\n\n${text}`, {
      reply_markup: buildConfirmKeyboard("confirm_url"),
    });
  } else {
    await ctx.reply("Send this text to your Kindle?", {
      reply_markup: buildConfirmKeyboard("confirm_text"),
    });
  }
});

bot.on("message:document", async (ctx) => {
  if (!ctx.session.userId) return;

  const device = await getValidSelectedDevice(ctx);
  if (!device) {
    await ctx.reply("Please select a device first. Use /device to choose one.");
    return;
  }

  await ctx.reply(`Send "${ctx.message.document?.file_name}" to your Kindle?`, {
    reply_markup: buildConfirmKeyboard("confirm_file"),
  });
});

// --- Confirmation callback handlers ---
bot.callbackQuery(/^confirm_url:/, async (ctx) => {
  const action = ctx.callbackQuery.data.split(":")[1];
  await ctx.answerCallbackQuery();

  if (action === "yes") {
    const messageText = ctx.callbackQuery.message?.text || "";
    const urlMatch = messageText.match(/\n\n(.+)$/);
    const url = urlMatch?.[1]?.trim();

    if (!url) {
      await ctx.editMessageText("❌ Could not find the URL. Please try /extract.");
      return;
    }

    await ctx.editMessageText("⏳ Extracting content from URL...");
    const result = await apiClient.extractUrl(url, ctx.session.userId!, ctx.session.selectedDeviceId);
    if (result.success) {
      await ctx.editMessageText(`✅ Sent to your Kindle!\n📄 ${result.data?.filename || "Document"}`);
    } else {
      await ctx.editMessageText(`❌ Failed: ${result.error || "Unknown error"}`);
    }
  } else {
    await ctx.editMessageText("Cancelled. Use /extract for more options.");
  }
});

bot.callbackQuery(/^confirm_text:/, async (ctx) => {
  const action = ctx.callbackQuery.data.split(":")[1];
  await ctx.answerCallbackQuery();

  if (action === "yes") {
    const repliedMsg = ctx.callbackQuery.message?.reply_to_message;
    const text = repliedMsg?.text;

    if (!text) {
      await ctx.editMessageText("❌ Could not find the text. Please try /extract.");
      return;
    }

    await ctx.editMessageText("⏳ Processing text...");
    const result = await apiClient.extractText(text, ctx.session.userId!, ctx.session.selectedDeviceId);
    if (result.success) {
      const title = result.data?.metadata?.title || result.data?.filename || "Document";
      await ctx.editMessageText(`✅ Sent to your Kindle!\n📄 ${title}`);
    } else {
      await ctx.editMessageText(`❌ Failed: ${result.error || "Unknown error"}`);
    }
  } else {
    await ctx.editMessageText("Cancelled. Use /extract for more options.");
  }
});

bot.callbackQuery(/^confirm_file:/, async (ctx) => {
  const action = ctx.callbackQuery.data.split(":")[1];
  await ctx.answerCallbackQuery();

  if (action === "yes") {
    const repliedMsg = ctx.callbackQuery.message?.reply_to_message;
    const doc = repliedMsg?.document;

    if (!doc) {
      await ctx.editMessageText("❌ Could not find the file. Please try /extract.");
      return;
    }

    await ctx.editMessageText("⏳ Processing file...");
    const file = await ctx.api.getFile(doc.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const fileResponse = await fetch(fileUrl);
    const arrayBuffer = await fileResponse.arrayBuffer();

    const result = await apiClient.extractFile(
      arrayBuffer,
      doc.file_name || "document",
      ctx.session.userId!,
      ctx.session.selectedDeviceId
    );
    if (result.success) {
      await ctx.editMessageText(`✅ Sent to your Kindle!\n📄 ${result.data?.filename || doc.file_name}`);
    } else {
      await ctx.editMessageText(`❌ Failed: ${result.error || "Unknown error"}`);
    }
  } else {
    await ctx.editMessageText("Cancelled. Use /extract for more options.");
  }
});

// --- Error handler ---
bot.catch((err) => {
  console.error("Bot error:", err.error);
  err.ctx.reply("An error occurred. Please try again.").catch(() => {});
});
