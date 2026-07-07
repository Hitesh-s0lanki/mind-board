import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (db) {
    return db;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Set it to your Neon Postgres connection string.",
    );
  }

  db = drizzle(neon(databaseUrl), { schema });
  return db;
}
