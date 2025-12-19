import { treaty } from "@elysiajs/eden";
import type { Api } from "../../../api/src/index";

// API URL - defaults to localhost:8080
// You can override by setting window.API_URL before the app loads
const API_URL = (typeof window !== "undefined" && (window as any).API_URL) || "http://localhost:8080";

// Create Eden Treaty client with type safety
export const api = treaty<Api>(API_URL);
