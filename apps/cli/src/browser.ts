import { spawn } from "node:child_process";

/** Best-effort: open a URL in the default browser. Returns false if it could not. */
export const openInBrowser = (url: string): boolean => {
  // Headless/SSH sessions: print the link instead of trying to open a browser.
  if (process.env.BETTERSENT_NO_BROWSER) return false;

  const [command, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];

  try {
    const child = spawn(command, args, { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
};
