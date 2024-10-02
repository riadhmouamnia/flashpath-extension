import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from "@neondatabase/serverless";
import * as schema from "./server/db/schemas";

async function main() {
  console.log("Migration started");
  console.log("DATABASE_URL", process.env.VITE_DATABASE_URL!);

  const client = neon(process.env.VITE_DATABASE_URL!);

  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: "./server/db/migrations" });

  console.log("Migration completed");

  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed");
  console.log(error);
  process.exit(1);
});
