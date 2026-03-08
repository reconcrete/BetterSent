import type { BotContext } from "../types/context";

export async function helpCommand(ctx: BotContext) {
  await ctx.reply(
    "Available commands:\n\n" +
      "/start — Log in or see welcome message\n" +
      "/device — List & select Kindle devices\n" +
      "/add_device — Add a new Kindle device\n" +
      "/extract — Send content to your Kindle\n" +
      "/me — View your account info\n" +
      "/logout — Log out\n" +
      "/help — Show this message\n\n" +
      "You can also just send me a URL, text, or file and I'll offer to send it to your Kindle."
  );
}
