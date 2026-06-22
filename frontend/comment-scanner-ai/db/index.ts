import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

let dbInstance: any;

if (databaseUrl) {
  const sql = neon(databaseUrl);
  dbInstance = drizzle(sql, { schema });
} else {
  if (process.env.NODE_ENV !== "production") {
    console.warn("⚠️ DATABASE_URL is not set. Drizzle DB queries will fail when invoked.");
  }
  dbInstance = new Proxy({}, {
    get(target, prop) {
      throw new Error(
        "DATABASE_URL environment variable is missing. Please set it in frontend/comment-scanner-ai/.env to connect to your Neon PostgreSQL database."
      );
    }
  });
}

export const db = dbInstance;
export * as schema from "./schema";
export type DbType = typeof dbInstance;
export type Project = typeof schema.projects.$inferSelect;
export type Comment = typeof schema.comments.$inferSelect;
export type Report = typeof schema.reports.$inferSelect;
