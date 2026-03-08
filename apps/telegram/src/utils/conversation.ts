import type { Conversation } from "@grammyjs/conversations";
import type { BotContext } from "../types/context";

/**
 * Checks if a text message is a bot command (starts with /).
 * If so, halts the conversation and passes the update to outer middleware.
 */
export function isCommand(text: string): boolean {
  return text.startsWith("/");
}

/**
 * Wait for a text message, but halt the conversation if the user sends a command.
 * This allows users to escape any conversation by typing a command like /device.
 */
export async function waitForText(
  conversation: Conversation<BotContext, BotContext>,
): Promise<{ text: string; ctx: BotContext } | null> {
  const ctx = await conversation.wait();
  const text = ctx.message?.text;

  if (!text) return null;

  if (isCommand(text)) {
    await conversation.halt({ next: true });
    return null; // unreachable, halt throws
  }

  return { text: text.trim(), ctx };
}
