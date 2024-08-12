import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./server/db/db";
export default defineConfig({
  schema: "./server/db/schemas.ts",
  out: "./server/db/migrations",
  dialect: "postgresql", // "postgresql" | "mysql"
  driver: "aws-data-api",
  dbCredentials: {
    database: DATABASE_URL,
    secretArn: "",
    resourceArn: "",
  },
  migrations: {
    table: "migrations",
    schema: "public",
  },
});
