import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schemas";

export const DATABASE_URL = "";

const client = neon(DATABASE_URL);
export const db = drizzle(client, { schema });
