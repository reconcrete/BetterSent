import * as p from "@clack/prompts";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";

import { CLI_CLIENT_ID, createApi } from "../api";
import { openInBrowser } from "../browser";
import { getApiUrl, writeConfig } from "../config";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const login = async (): Promise<void> => {
  const apiUrl = getApiUrl();
  const authClient = createAuthClient({
    baseURL: apiUrl,
    plugins: [deviceAuthorizationClient()],
  });

  p.intro("bettersent login");

  const { data: grant, error: grantError } = await authClient.device.code({
    client_id: CLI_CLIENT_ID,
  });

  if (grantError || !grant) {
    p.cancel(
      `Could not reach ${apiUrl}: ${grantError?.error_description || "unknown error"}`,
    );
    process.exit(1);
  }

  p.log.message(`Your confirmation code: ${grant.user_code}`);
  p.log.message(`Confirm it at: ${grant.verification_uri_complete}`);

  const opened = openInBrowser(grant.verification_uri_complete);
  const spinner = p.spinner();
  spinner.start(
    opened
      ? "Opening your browser — approve the request there…"
      : "Open the link above in your browser to approve the request…",
  );

  const deadline = Date.now() + grant.expires_in * 1000;
  let intervalMs = grant.interval * 1000;

  while (Date.now() < deadline) {
    await sleep(intervalMs);

    const { data, error } = await authClient.device.token({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: grant.device_code,
      client_id: CLI_CLIENT_ID,
    });

    if (data?.access_token) {
      writeConfig({ apiUrl, token: data.access_token });

      // Greet the user by name to confirm which account is connected.
      const me = await createApi(data.access_token).user.me.get();
      const who =
        me.data?.success && me.data.data
          ? ` as ${me.data.data.email ?? me.data.data.name}`
          : "";

      spinner.stop(`Logged in${who}.`);
      p.outro("You're all set. Try: bettersent --url <link>");
      return;
    }

    const code = error?.error;
    if (code === "authorization_pending") continue;
    if (code === "slow_down") {
      intervalMs += 5000;
      continue;
    }

    spinner.stop("Login failed.");
    p.cancel(
      code === "access_denied"
        ? "The request was denied in the browser."
        : code === "expired_token"
          ? "The code expired before it was approved. Run `bettersent login` again."
          : error?.error_description || "Unexpected error while waiting for approval.",
    );
    process.exit(1);
  }

  spinner.stop("Login failed.");
  p.cancel("The code expired before it was approved. Run `bettersent login` again.");
  process.exit(1);
};
