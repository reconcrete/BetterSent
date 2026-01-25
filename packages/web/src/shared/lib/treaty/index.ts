import { treaty } from "@elysiajs/eden";
import type { Api } from "~/api/index";

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return "http://localhost:8080";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `http://${url}`;
};

export const api = treaty<Api>(getBaseURL(), {
  fetch: {
    credentials: "include",
  },
});
