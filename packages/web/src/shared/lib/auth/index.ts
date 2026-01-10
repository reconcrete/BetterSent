import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return "http://localhost:8080";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `http://${url}`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
