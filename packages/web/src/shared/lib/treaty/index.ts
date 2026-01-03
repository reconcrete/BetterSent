import { treaty } from "@elysiajs/eden";
import type { Api } from "~/api/index";

export const api = treaty<Api>("http://100.86.107.10:8080");
