import { spawn } from "node:child_process";

/** Opens a URL in the user's default browser. Best effort — the CLI always prints the URL too. */
export function openBrowser(url: string): void {
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";

  try {
    const child = spawn(command, [url], { stdio: "ignore", detached: true, shell: process.platform === "win32" });
    child.on("error", () => {});
    child.unref();
  } catch {
    // Headless machine or no browser — the printed URL is the fallback.
  }
}
