import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return "http://localhost:8080";
  
  // Strip protocol if present to normalize
  const urlWithoutProtocol = url.replace(/^https?:\/\//, "");
  
  // Use HTTP only for localhost, HTTPS for everything else (production)
  if (urlWithoutProtocol.includes("localhost") || urlWithoutProtocol.includes("127.0.0.1")) {
    return `http://${urlWithoutProtocol}`;
  }
  return `https://${urlWithoutProtocol}`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [magicLinkClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
