import { createDb } from "@bettersent/db";

const connectionString = process.env.DATABASE_URL!;

export const db = createDb(connectionString);
