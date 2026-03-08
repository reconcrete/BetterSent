import type { BotContext } from "../types/context";

export async function logoutCommand(ctx: BotContext) {
  ctx.session.userId = undefined;
  ctx.session.email = undefined;
  ctx.session.selectedDeviceId = undefined;

  await ctx.reply("You've been logged out. Use /start to log in again.");
}
