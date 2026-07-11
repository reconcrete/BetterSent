import { parseArgs } from "node:util";

export type SendSource = { type: "url" | "youtube" | "file"; value: string };

export type ParsedArgs =
  | { command: "login" }
  | { command: "logout" }
  | { command: "setup" }
  | { command: "help" }
  | { command: "version" }
  | { command: "send"; source: SendSource; chooseDevice: boolean }
  | { command: "error"; message: string };

const OPTIONS = {
  url: { type: "string" },
  file: { type: "string" },
  youtube: { type: "string" },
  "choose-device": { type: "boolean", default: false },
  help: { type: "boolean", short: "h", default: false },
  version: { type: "boolean", short: "v", default: false },
} as const;

export function parseCliArgs(argv: string[]): ParsedArgs {
  let values: {
    url?: string;
    file?: string;
    youtube?: string;
    "choose-device"?: boolean;
    help?: boolean;
    version?: boolean;
  };
  let positionals: string[];

  try {
    ({ values, positionals } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true }));
  } catch (error) {
    return { command: "error", message: error instanceof Error ? error.message : "Invalid arguments" };
  }

  if (values.help) return { command: "help" };
  if (values.version) return { command: "version" };

  const [subcommand, ...extraPositionals] = positionals;

  if (subcommand) {
    if (extraPositionals.length > 0) {
      return { command: "error", message: `Unexpected argument: ${extraPositionals[0]}` };
    }
    if (subcommand === "login" || subcommand === "logout" || subcommand === "setup") {
      return { command: subcommand };
    }
    return { command: "error", message: `Unknown command: ${subcommand}` };
  }

  const sources: SendSource[] = [
    ...(values.url ? [{ type: "url" as const, value: values.url }] : []),
    ...(values.youtube ? [{ type: "youtube" as const, value: values.youtube }] : []),
    ...(values.file ? [{ type: "file" as const, value: values.file }] : []),
  ];

  if (sources.length === 0) return { command: "help" };
  if (sources.length > 1) {
    return { command: "error", message: "Pass only one of --url, --file or --youtube" };
  }

  return {
    command: "send",
    source: sources[0]!,
    chooseDevice: values["choose-device"] ?? false,
  };
}
