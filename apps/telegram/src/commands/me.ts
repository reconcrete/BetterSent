import { eq } from "@bettersent/db";
import { db, user, kindleEmailAddress } from "../db";
import type { BotContext } from "../types/context";

export async function meCommand(ctx: BotContext) {
  const userId = ctx.session.userId!;

  const userData = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userData) {
    await ctx.reply("Account not found. Try /start to log in again.");
    return;
  }

  const devices = await db.query.kindleEmailAddress.findMany({
    where: eq(kindleEmailAddress.userId, userId),
  });

  const selectedDevice = devices.find((d) => d.id === ctx.session.selectedDeviceId);

  let text = `Account info:\n\n`;
  text += `Email: ${userData.email}\n`;
  text += `Name: ${userData.name}\n`;
  text += `Registered: ${userData.createdAt.toLocaleDateString()}\n`;
  text += `Devices: ${devices.length}\n`;

  if (selectedDevice) {
    text += `Active device: ${selectedDevice.label || selectedDevice.email}`;
  } else {
    text += `Active device: none (use /device to select)`;
  }

  await ctx.reply(text);
}
