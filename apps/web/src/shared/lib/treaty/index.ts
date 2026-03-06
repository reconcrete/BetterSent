import { treaty } from "@elysiajs/eden";
import type { Api } from "~/api/index";

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;
  const mode = import.meta.env.MODE;
  if (!url) return "http://localhost:8080";
  
  // Strip protocol if present to normalize
  const urlWithoutProtocol = url.replace(/^https?:\/\//, "");

  if (mode === "development") {
    return `http://${urlWithoutProtocol}`;
  }
  
  // Use HTTP only for localhost, HTTPS for everything else (production)
  if (urlWithoutProtocol.includes("localhost") || urlWithoutProtocol.includes("127.0.0.1")) {
    return `http://${urlWithoutProtocol}`;
  }
  return `https://${urlWithoutProtocol}`;
};

export const api = treaty<Api>(getBaseURL(), {
  fetch: {
    credentials: "include",
  },
});
