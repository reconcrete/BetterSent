import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return "http://localhost:8080";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Default to HTTPS for production URLs, HTTP only for localhost
  if (url.includes("localhost") || url.includes("127.0.0.1")) return `http://${url}`;
  return `https://${url}`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
