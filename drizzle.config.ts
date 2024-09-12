import { defineConfig } from "drizzle-kit";

console.log("DATABASE_URL in config", process.env.VITE_DATABASE_URL!);

export default defineConfig({
  schema: "./server/db/schemas.ts",
  out: "./server/db/migrations",
  dialect: "postgresql", // "postgresql" | "mysql"
  driver: "aws-data-api",
  dbCredentials: {
    database: process.env.VITE_DATABASE_URL!,
    secretArn: "",
    resourceArn: "",
  },
  migrations: {
    table: "migrations",
    schema: "public",
  },
});
