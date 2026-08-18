import { createAuthClient } from "better-auth/react";
import { deviceAuthorizationClient, magicLinkClient } from "better-auth/client/plugins";
import { isProduction, magicLinkEnabled } from "../env";

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;

  if (!url) return "http://localhost:8080";

  // Strip protocol if present to normalize
  const urlWithoutProtocol = url.replace(/^https?:\/\//, "");

  if (!isProduction) {
    return `http://${urlWithoutProtocol}`;
  }

  // Use HTTP only for localhost, HTTPS for everything else (production)
  if (urlWithoutProtocol.includes("localhost") || urlWithoutProtocol.includes("127.0.0.1")) {
    return `http://${urlWithoutProtocol}`;
  }
  return `https://${urlWithoutProtocol}`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    deviceAuthorizationClient(),
    ...(magicLinkEnabled ? [magicLinkClient()] : []),
  ],
});

export const { signIn, signOut, useSession } = authClient;
