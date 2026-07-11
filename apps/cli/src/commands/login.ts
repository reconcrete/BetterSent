import { hostname } from "node:os";

import * as p from "@clack/prompts";
import color from "picocolors";

import { AUTHORIZATION_PENDING, exchangeDeviceCode, requestDeviceCode } from "../api/client";
import { openBrowser } from "../lib/browser";
import { readCredentials, writeCredentials } from "../lib/credentials";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function login(): Promise<number> {
  p.intro(color.bgCyan(color.black(" bettersent login ")));

  const existing = await readCredentials();
  if (existing) {
    const proceed = await p.confirm({
      message: `Already logged in as ${color.cyan(existing.email)}. Log in again?`,
      initialValue: false,
    });
    if (p.isCancel(proceed) || !proceed) {
      p.outro("Nothing to do.");
      return 0;
    }
  }

  // The hostname is shown on the approval screen, so the user can see which machine is asking.
  const requested = await requestDeviceCode(hostname());
  if (!requested.success) {
    p.cancel(requested.error);
    return 1;
  }

  const { deviceCode, userCode, verificationUrlComplete, expiresIn, interval } = requested.data;

  p.note(
    `${color.dim("Your confirmation code")}\n\n  ${color.bold(color.cyan(userCode))}\n\n${color.dim(
      "Check that this matches the code in your browser."
    )}`,
    "Confirm this code"
  );

  p.log.info(`Opening ${color.underline(verificationUrlComplete)}`);
  openBrowser(verificationUrlComplete);

  const spinner = p.spinner();
  spinner.start("Waiting for you to confirm in the browser");

  const deadline = Date.now() + expiresIn * 1000;

  while (Date.now() < deadline) {
    await sleep(interval * 1000);

    const exchanged = await exchangeDeviceCode(deviceCode);

    if (exchanged.success) {
      await writeCredentials({
        token: exchanged.data.token,
        email: exchanged.data.user.email,
        name: exchanged.data.user.name,
      });
      spinner.stop(`Logged in as ${color.cyan(exchanged.data.user.email)}`);
      p.outro("You're all set. Try `bettersent --url <link>`.");
      return 0;
    }

    if (exchanged.status !== AUTHORIZATION_PENDING) {
      spinner.stop("Login failed", 1);
      p.cancel(exchanged.error);
      return 1;
    }
  }

  spinner.stop("Login timed out", 1);
  p.cancel("The code expired. Run `bettersent login` again.");
  return 1;
}
