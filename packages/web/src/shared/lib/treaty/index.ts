import { treaty } from "@elysiajs/eden";
import type { Api } from "~/api/index";

export const api = treaty<Api>(import.meta.env.VITE_API_URL ?? "http://localhost:8080");
