import type { NextFunction } from "grammy";
import type { BotContext } from "../types/context";

const PUBLIC_COMMANDS = ["/start", "/help"];

export async function authGuard(ctx: BotContext, next: NextFunction) {
  const text = ctx.message?.text;

  // Allow public commands through
  if (text && PUBLIC_COMMANDS.some((cmd) => text.startsWith(cmd))) {
    return next();
  }

  // Allow callback queries related to auth conversation
  if (ctx.callbackQuery) {
    return next();
  }

  // Block unauthenticated users
  if (!ctx.session.userId) {
    await ctx.reply("Please login first. Use /start to get started.");
    return;
  }

  return next();
}
