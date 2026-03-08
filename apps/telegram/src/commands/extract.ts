import type { BotContext } from "../types/context";

export async function extractCommand(ctx: BotContext) {
  await ctx.conversation.enter("extract");
}
