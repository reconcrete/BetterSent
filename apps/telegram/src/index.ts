import { Telegraf, Markup, Context } from "telegraf";
import {
  initStorage,
  getSession,
  setSession,
  updateSession,
  deleteSession,
  hasSession,
  type UserSession,
} from "./storage";
import {
  signIn,
  getKindleEmails,
  createKindleEmail,
  setDefaultKindleEmail,
  sendText,
  sendUrl,
  checkSession,
} from "./api";

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize storage
initStorage();

const bot = new Telegraf(BOT_TOKEN);

// Track users waiting for input
const awaitingInput = new Map<
  number,
  { type: "email" | "password" | "kindle_email" | "kindle_label"; email?: string }
>();

// Helper to check if message looks like a URL
function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim());
}

// Helper to get authenticated session or prompt login
async function requireAuth(
  ctx: Context,
  userId: number
): Promise<UserSession | null> {
  const session = getSession(userId);
  if (!session?.cookie) {
    await ctx.reply(
      "You need to log in first. Use /login to authenticate with your Bettersent account."
    );
    return null;
  }

  // Check if session is still valid
  const isValid = await checkSession(session.cookie);
  if (!isValid) {
    await deleteSession(userId);
    await ctx.reply(
      "Your session has expired. Please use /login to authenticate again."
    );
    return null;
  }

  return session;
}

// /start command
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const isLoggedIn = hasSession(userId);

  if (isLoggedIn) {
    await ctx.reply(
      "Welcome back to Bettersent!\n\n" +
        "You can:\n" +
        "- Send a URL to extract and send to your Kindle\n" +
        "- Send text to convert and send to your Kindle\n" +
        "- Use /kindle to manage your Kindle emails\n" +
        "- Use /logout to sign out"
    );
  } else {
    await ctx.reply(
      "Welcome to Bettersent Bot!\n\n" +
        "This bot lets you send articles and text to your Kindle device.\n\n" +
        "To get started, please log in with your Bettersent account using /login"
    );
  }
});

// /login command
bot.command("login", async (ctx) => {
  const userId = ctx.from.id;

  if (hasSession(userId)) {
    await ctx.reply(
      "You are already logged in. Use /logout first if you want to switch accounts."
    );
    return;
  }

  awaitingInput.set(userId, { type: "email" });
  await ctx.reply("Please enter your email address:");
});

// /logout command
bot.command("logout", async (ctx) => {
  const userId = ctx.from.id;

  if (!hasSession(userId)) {
    await ctx.reply("You are not logged in.");
    return;
  }

  await deleteSession(userId);
  awaitingInput.delete(userId);
  await ctx.reply("You have been logged out successfully.");
});

// /kindle command - list and manage kindle emails
bot.command("kindle", async (ctx) => {
  const userId = ctx.from.id;
  const session = await requireAuth(ctx, userId);
  if (!session) return;

  const result = await getKindleEmails(session.cookie);
  if (!result.success || !result.data) {
    await ctx.reply(`Failed to fetch Kindle emails: ${result.error}`);
    return;
  }

  const emails = result.data;
  if (emails.length === 0) {
    await ctx.reply(
      "You don't have any Kindle email addresses configured.\n\n" +
        "Use /add_kindle to add one."
    );
    return;
  }

  // Build inline keyboard for selection
  const buttons = emails.map((email) => [
    Markup.button.callback(
      `${email.label || email.email}${email.isDefault ? " ✓" : ""}`,
      `select_kindle:${email.id}`
    ),
  ]);

  const currentKindle = emails.find((e) => e.id === session.kindleEmailId);
  const defaultKindle = emails.find((e) => e.isDefault);
  const activeKindle = currentKindle || defaultKindle;

  await ctx.reply(
    `Your Kindle email addresses:\n\n` +
      `Currently selected: ${activeKindle ? activeKindle.label || activeKindle.email : "None"}\n\n` +
      `Tap to select a different one:`,
    Markup.inlineKeyboard(buttons)
  );
});

// /add_kindle command
bot.command("add_kindle", async (ctx) => {
  const userId = ctx.from.id;
  const session = await requireAuth(ctx, userId);
  if (!session) return;

  awaitingInput.set(userId, { type: "kindle_email" });
  await ctx.reply(
    "Please enter your Kindle email address (e.g., yourname@kindle.com):"
  );
});

// Handle Kindle selection callback
bot.action(/^select_kindle:(.+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = getSession(userId);
  if (!session) {
    await ctx.answerCbQuery("Session expired. Please /login again.");
    return;
  }

  const kindleEmailId = ctx.match[1];
  await updateSession(userId, { kindleEmailId });

  // Get kindle details for confirmation
  const result = await getKindleEmails(session.cookie);
  const kindle = result.data?.find((e) => e.id === kindleEmailId);

  await ctx.answerCbQuery(`Selected: ${kindle?.label || kindle?.email}`);
  await ctx.editMessageText(
    `Selected Kindle: ${kindle?.label || kindle?.email}\n\n` +
      "Now you can send URLs or text and they will be delivered to this Kindle."
  );
});

// /help command
bot.command("help", async (ctx) => {
  await ctx.reply(
    "Bettersent Bot Commands:\n\n" +
      "/start - Start the bot\n" +
      "/login - Log in with your Bettersent account\n" +
      "/logout - Log out\n" +
      "/kindle - List and select Kindle email\n" +
      "/add_kindle - Add a new Kindle email\n" +
      "/help - Show this help message\n\n" +
      "You can also just send:\n" +
      "- A URL to extract the article and send to Kindle\n" +
      "- Any text to convert and send to Kindle"
  );
});

// Handle text messages (login flow + content sending)
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();

  // Check if we're waiting for input
  const waiting = awaitingInput.get(userId);

  if (waiting) {
    switch (waiting.type) {
      case "email": {
        // Validate email format
        if (!text.includes("@")) {
          await ctx.reply("Please enter a valid email address:");
          return;
        }
        awaitingInput.set(userId, { type: "password", email: text });
        await ctx.reply("Please enter your password:");
        return;
      }

      case "password": {
        const email = waiting.email!;
        awaitingInput.delete(userId);

        await ctx.reply("Logging in...");

        const result = await signIn(email, text);
        if (!result.success) {
          await ctx.reply(
            `Login failed: ${result.error}\n\nUse /login to try again.`
          );
          return;
        }

        await setSession(userId, { cookie: result.cookie!, email });
        await ctx.reply(
          "Login successful! You can now:\n\n" +
            "- Send a URL to extract and send to your Kindle\n" +
            "- Send text to convert and send to your Kindle\n" +
            "- Use /kindle to select which Kindle to send to"
        );
        return;
      }

      case "kindle_email": {
        // Validate kindle email
        if (!text.includes("@")) {
          await ctx.reply("Please enter a valid email address:");
          return;
        }
        awaitingInput.set(userId, { type: "kindle_label", email: text });
        await ctx.reply(
          "Enter a label for this Kindle (or send /skip to skip):"
        );
        return;
      }

      case "kindle_label": {
        const kindleEmail = waiting.email!;
        const label = text === "/skip" ? undefined : text;
        awaitingInput.delete(userId);

        const session = getSession(userId);
        if (!session?.cookie) {
          await ctx.reply("Session expired. Please /login again.");
          return;
        }

        const result = await createKindleEmail(session.cookie, kindleEmail, label);
        if (!result.success) {
          await ctx.reply(`Failed to add Kindle email: ${result.error}`);
          return;
        }

        // Set as selected kindle
        await updateSession(userId, { kindleEmailId: result.data!.id });
        await ctx.reply(
          `Kindle email added: ${label || kindleEmail}\n\n` +
            "It's now selected as your active Kindle. Send a URL or text to try it out!"
        );
        return;
      }
    }
  }

  // Not waiting for input - handle as content to send
  const session = await requireAuth(ctx, userId);
  if (!session) return;

  // Check if user has a Kindle email selected
  const kindlesResult = await getKindleEmails(session.cookie);
  if (!kindlesResult.success || !kindlesResult.data?.length) {
    await ctx.reply(
      "You don't have any Kindle email configured.\n\n" +
        "Use /add_kindle to add one first."
    );
    return;
  }

  // Use selected kindle or default
  const kindleEmailId =
    session.kindleEmailId ||
    kindlesResult.data.find((e) => e.isDefault)?.id ||
    kindlesResult.data[0].id;

  const kindle = kindlesResult.data.find((e) => e.id === kindleEmailId);

  await ctx.reply(`Sending to ${kindle?.label || kindle?.email}...`);

  // Determine if URL or text
  if (isUrl(text)) {
    const result = await sendUrl(session.cookie, text, kindleEmailId);
    if (!result.success) {
      await ctx.reply(`Failed to send: ${result.error}`);
      return;
    }
    await ctx.reply(
      `Article sent to your Kindle!\n\nFilename: ${result.data!.filename}`
    );
  } else {
    const result = await sendText(session.cookie, text, kindleEmailId);
    if (!result.success) {
      await ctx.reply(`Failed to send: ${result.error}`);
      return;
    }
    await ctx.reply(
      `Text sent to your Kindle!\n\nFilename: ${result.data!.filename}`
    );
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error("Bot error:", err);
  ctx.reply("An error occurred. Please try again.").catch(console.error);
});

// Start bot
bot.launch().then(() => {
  console.log("Bettersent Telegram bot is running");
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
