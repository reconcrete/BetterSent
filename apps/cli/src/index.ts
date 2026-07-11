#!/usr/bin/env bun
import color from "picocolors";

import pkg from "../package.json" with { type: "json" };
import { login } from "./commands/login";
import { logout } from "./commands/logout";
import { setup } from "./commands/setup";
import { send } from "./commands/send";
import { parseCliArgs } from "./lib/args";

const HELP = `
${color.bold("bettersent")} — send content to your Kindle

${color.bold("Usage")}
  bettersent --url <link>          Send a web page
  bettersent --file <path>         Send a file from your filesystem
  bettersent --youtube <link>      Send a YouTube video

${color.bold("Options")}
  --choose-device                  Pick which device to send to (defaults to your default device)
  -h, --help                       Show this help
  -v, --version                    Show the version

${color.bold("Commands")}
  bettersent login                 Sign in from this machine
  bettersent logout                Sign out of this machine
  bettersent setup                 Add or edit your devices
`;

async function main(): Promise<number> {
  const parsed = parseCliArgs(process.argv.slice(2));

  switch (parsed.command) {
    case "help":
      console.log(HELP);
      return 0;
    case "version":
      console.log(pkg.version);
      return 0;
    case "login":
      return login();
    case "logout":
      return logout();
    case "setup":
      return setup();
    case "send":
      return send(parsed.source, parsed.chooseDevice);
    case "error":
      console.error(`${color.red("error")} ${parsed.message}`);
      console.log(HELP);
      return 1;
  }
}

process.exit(await main());
