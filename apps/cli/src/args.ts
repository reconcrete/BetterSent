import { parseArgs } from "node:util";

export type SendKind = "url" | "file" | "youtube";

export type ParsedCommand =
  | { command: "login" }
  | { command: "logout" }
  | { command: "setup" }
  | { command: "help" }
  | { command: "version" }
  | { command: "send"; kind: SendKind; target: string; chooseDevice: boolean };

export class UsageError extends Error {}

const SUBCOMMANDS = new Set(["login", "logout", "setup"]);

/**
 * Parse CLI arguments (everything after `bettersent`).
 *
 * Grammar:
 *   bettersent login | logout | setup
 *   bettersent --url <link> | --file <path> | --youtube <link> [--choose-device]
 *   bettersent --help | --version
 */
export const parse = (argv: string[]): ParsedCommand => {
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
    ({ values, positionals } = parseArgs({
      args: argv,
      options: {
        url: { type: "string" },
        file: { type: "string" },
        youtube: { type: "string" },
        "choose-device": { type: "boolean" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
      allowPositionals: true,
    }));
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : "Invalid arguments");
  }

  if (values.help) return { command: "help" };
  if (values.version) return { command: "version" };

  const sendFlags = (["url", "file", "youtube"] as const).filter((key) => values[key] !== undefined);

  if (positionals.length > 0) {
    const [subcommand, ...rest] = positionals;
    if (!SUBCOMMANDS.has(subcommand)) {
      throw new UsageError(
        `Unknown command "${subcommand}". Available commands: login, logout, setup.`,
      );
    }
    if (rest.length > 0) {
      throw new UsageError(`Unexpected argument "${rest[0]}" after "${subcommand}".`);
    }
    if (sendFlags.length > 0 || values["choose-device"]) {
      throw new UsageError(`"${subcommand}" does not take any flags.`);
    }
    return { command: subcommand as "login" | "logout" | "setup" };
  }

  if (sendFlags.length === 0) {
    if (values["choose-device"]) {
      throw new UsageError("--choose-device requires one of --url, --file, or --youtube.");
    }
    return { command: "help" };
  }

  if (sendFlags.length > 1) {
    throw new UsageError(
      `Pass only one of --url, --file, or --youtube (got ${sendFlags.map((f) => `--${f}`).join(", ")}).`,
    );
  }

  const kind = sendFlags[0];
  const target = values[kind]!.trim();
  if (!target) {
    throw new UsageError(`--${kind} requires a value.`);
  }

  return {
    command: "send",
    kind,
    target,
    chooseDevice: values["choose-device"] ?? false,
  };
};
