import { bot } from "./bot";

// Set bot commands menu
await bot.api.setMyCommands([
  { command: "start", description: "Log in or see welcome message" },
  { command: "device", description: "List & select Kindle devices" },
  { command: "add_device", description: "Add a new Kindle device" },
  { command: "extract", description: "Send content to your Kindle" },
  { command: "me", description: "View your account info" },
  { command: "help", description: "Show available commands" },
  { command: "logout", description: "Log out" },
]);

async function startBot(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log("Bot starting...");
      await bot.api.deleteWebhook({ drop_pending_updates: true });
      await bot.start();
      return;
    } catch (err: any) {
      if (err?.error_code === 409 && i < retries - 1) {
        console.log(`409 conflict, retrying in ${(i + 1) * 2}s...`);
        await new Promise((r) => setTimeout(r, (i + 1) * 2000));
        continue;
      }
      throw err;
    }
  }
}

startBot();
