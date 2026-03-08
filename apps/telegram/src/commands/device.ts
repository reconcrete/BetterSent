import { eq } from "@bettersent/db";
import { db, kindleEmailAddress } from "../db";
import { buildDeviceKeyboard } from "../keyboards/devices";
import type { BotContext } from "../types/context";

export async function deviceCommand(ctx: BotContext) {
  const userId = ctx.session.userId!;

  const devices = await db.query.kindleEmailAddress.findMany({
    where: eq(kindleEmailAddress.userId, userId),
  });

  if (devices.length === 0) {
    await ctx.reply("No devices yet. Use /add_device to add one.");
    return;
  }

  await ctx.reply("Select what device to send content to. Your Kindle devices:", {
    reply_markup: buildDeviceKeyboard(devices, ctx.session.selectedDeviceId),
  });
}
