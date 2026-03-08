import type { BotContext } from "../types/context";

export async function addDeviceCommand(ctx: BotContext) {
  await ctx.conversation.enter("addDevice");
}
