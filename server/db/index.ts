import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schemas";

const client = neon(import.meta.env.VITE_DATABASE_URL!);
export const db = drizzle(client, { schema });
