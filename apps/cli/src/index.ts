#!/usr/bin/env bun
import { parse, UsageError } from "./args";
import { login } from "./commands/login";
import { logout } from "./commands/logout";
import { send } from "./commands/send";
import { setup } from "./commands/setup";
import packageJson from "../package.json";

const HELP = `bettersent — send content to your e-reader from the terminal

Usage
  bettersent --url <link>        Send a web page
  bettersent --file <path>       Send a file (pdf, epub, docx, md, html, images, …)
  bettersent --youtube <link>    Send a YouTube video
  bettersent login               Sign in (opens your browser)
  bettersent setup               Add or edit your devices
  bettersent logout              Sign out

Flags
  --choose-device                Pick a device instead of using the default
  -h, --help                     Show this help
  -v, --version                  Show the version

Environment
  BETTERSENT_API_URL             Override the API server (defaults to production)
`;

const main = async (): Promise<void> => {
  let command;
  try {
    command = parse(process.argv.slice(2));
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`Error: ${error.message}\n`);
      console.error(HELP);
      process.exit(1);
    }
    throw error;
  }

  switch (command.command) {
    case "help":
      console.log(HELP);
      return;
    case "version":
      console.log(packageJson.version);
      return;
    case "login":
      return login();
    case "logout":
      return logout();
    case "setup":
      return setup();
    case "send":
      return send(command.kind, command.target, command.chooseDevice);
  }
};

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
