import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL no está configurada");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.pg.ts",
  out: "./drizzle-postgres",
  dbCredentials: {
    url: databaseUrl,
  },
});