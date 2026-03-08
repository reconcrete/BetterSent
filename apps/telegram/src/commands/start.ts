import type { BotContext } from "../types/context";

export async function startCommand(ctx: BotContext) {
  if (ctx.session.userId) {
    await ctx.reply(
      `Welcome back, ${ctx.session.email}!\n\nUse /help to see available commands.`
    );
    return;
  }

  await ctx.reply(
    "Welcome to Bettersent! 📚\n\n" +
      "I can help you send articles, text, and files to your Kindle device.\n\n" +
      "Let's get you set up — starting with login."
  );

  await ctx.conversation.enter("auth");
}
