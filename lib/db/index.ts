import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
const databaseUrl =
  isTestMode && process.env.TEST_DATABASE_URL
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL!;

if (isTestMode) {
  console.log("[db] Test mode active — using TEST_DATABASE_URL");
}

const sql = neon(databaseUrl);

export const db = drizzle({ client: sql, schema });
