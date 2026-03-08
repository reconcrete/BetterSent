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

console.log("Bot starting...");
bot.start();
