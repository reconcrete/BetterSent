import type { Conversation } from "@grammyjs/conversations";
import { eq } from "@bettersent/db";
import { db, user } from "../db";
import { emailSchema } from "../utils/validators";
import { generateCode, sendVerificationCode } from "../utils/mail";
import { isCommand } from "../utils/conversation";
import type { BotContext } from "../types/context";

const MAX_ATTEMPTS = 3;

export const AUTH_CONVERSATION = "auth";

export async function authConversation(
  conversation: Conversation<BotContext, BotContext>,
  ctx: BotContext
) {
  await ctx.reply("Please enter your email address to log in:");

  let email: string | undefined;

  while (!email) {
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
    email = result.data;
  }

  // Generate and send verification code
  const code = await conversation.external(() => generateCode());
  const sent = await conversation.external(() => sendVerificationCode(email!, code));

  if (!sent) {
    await ctx.reply("Failed to send verification email. Please try again with /start.");
    return;
  }

  await ctx.reply(`A 6-digit verification code has been sent to ${email}. Please enter it:`);

  let verified = false;
  let attempts = 0;

  while (!verified && attempts < MAX_ATTEMPTS) {
    const codeResponse = await conversation.waitFor("message:text");
    const enteredCode = codeResponse.message.text.trim();

    if (isCommand(enteredCode)) {
      await conversation.halt({ next: true });
    }

    if (enteredCode === code) {
      verified = true;
    } else {
      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        await codeResponse.reply(
          `Wrong code. ${MAX_ATTEMPTS - attempts} attempt(s) left. Try again:`
        );
      }
    }
  }

  if (!verified) {
    await ctx.reply("Too many wrong attempts. Please start over with /start.");
    return;
  }

  // Look up or create user
  const existingUser = await conversation.external(() =>
    db.query.user.findFirst({
      where: eq(user.email, email!),
    })
  );

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    userId = crypto.randomUUID();
    await conversation.external(() =>
      db.insert(user).values({
        id: userId,
        name: email!.split("@")[0],
        email: email!,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  await conversation.external((ctx) => {
    ctx.session.userId = userId;
    ctx.session.email = email;
  });

  await ctx.reply(
    `You're logged in as ${email}!\n\nUse /device to manage your Kindle devices, or /help to see all commands.`
  );
}
