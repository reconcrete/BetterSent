import { createDb } from "@bettersent/db";
import { DATABASE_URL } from "./config";

export const db = createDb(DATABASE_URL);

// Re-export commonly used tables
export { user, kindleEmailAddress } from "@bettersent/db/schema";
