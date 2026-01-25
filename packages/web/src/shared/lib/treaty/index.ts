import { treaty } from "@elysiajs/eden";
import type { Api } from "~/api/index";

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return "http://localhost:8080";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Default to HTTPS for production URLs, HTTP only for localhost
  if (url.includes("localhost") || url.includes("127.0.0.1")) return `http://${url}`;
  return `https://${url}`;
};

export const api = treaty<Api>(getBaseURL(), {
  fetch: {
    credentials: "include",
  },
});
