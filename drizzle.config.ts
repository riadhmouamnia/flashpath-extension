import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/schemas.ts",
  out: "./server/db/migrations",
  dialect: "postgresql", // "postgresql" | "mysql"
  driver: "aws-data-api",
  dbCredentials: {
    database: "",
    secretArn: "",
    resourceArn: "",
  },
  migrations: {
    table: "migrations",
    schema: "public",
  },
});
