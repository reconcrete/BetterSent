import type { Conversation } from "@grammyjs/conversations";
import { db, kindleEmailAddress } from "../db";
import { emailSchema } from "../utils/validators";
import { buildConfirmKeyboard } from "../keyboards/extraction";
import { isCommand } from "../utils/conversation";
import type { BotContext } from "../types/context";

export const ADD_DEVICE_CONVERSATION = "addDevice";

export async function addDeviceConversation(
  conversation: Conversation<BotContext, BotContext>,
  ctx: BotContext
) {
  await ctx.reply("Enter your Kindle email address (e.g. yourname@kindle.com):");

  let kindleEmail: string | undefined;

  while (!kindleEmail) {
    const response = await conversation.waitFor("message:text");
    const text = response.message.text.trim();

    if (isCommand(text)) {
      await conversation.halt({ next: true });
    }

    const result = emailSchema.safeParse(text);
    if (!result.success) {
      await response.reply("That doesn't look like a valid email. Please try again:");
      continue;
    }
    kindleEmail = result.data;
  }

  await ctx.reply("Enter a label for this device (e.g. My Kindle Paperwhite):");
  const labelResponse = await conversation.waitFor("message:text");
  const labelText = labelResponse.message.text.trim();

  if (isCommand(labelText)) {
    await conversation.halt({ next: true });
  }

  const label = labelText;
  const userId = await conversation.external((ctx) => ctx.session.userId!);
  const deviceId = crypto.randomUUID();

  await conversation.external(() =>
    db.insert(kindleEmailAddress).values({
      id: deviceId,
      email: kindleEmail!,
      label,
      userId,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  await ctx.reply(
    `Device "${label}" (${kindleEmail}) added!\n\nSelect as your current device?`,
    { reply_markup: buildConfirmKeyboard("device_set_current") }
  );

  const callback = await conversation.waitForCallbackQuery([
    "device_set_current:yes",
    "device_set_current:no",
  ]);

  if (callback.callbackQuery.data === "device_set_current:yes") {
    await conversation.external((ctx) => {
      ctx.session.selectedDeviceId = deviceId;
    });
    await callback.editMessageText(`✅ "${label}" is now your current device.`);
  } else {
    await callback.editMessageText(`Device added. Use /device to select it later.`);
  }
}
