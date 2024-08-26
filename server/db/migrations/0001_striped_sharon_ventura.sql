DROP INDEX IF EXISTS "interactions_page_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "notes_page_id_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "interactions_page_id_idx" ON "interactions" ("page_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notes_page_id_idx" ON "notes" ("page_id");