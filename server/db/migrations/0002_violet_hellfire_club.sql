CREATE TABLE IF NOT EXISTS "rrweb_events_with_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" serial NOT NULL,
	"event" json,
	"chunk" text,
	"chunk_index" integer,
	"total_chunks" integer,
	"is_chunked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rrweb_events_with_chunks" ADD CONSTRAINT "rrweb_events_with_chunks_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "rrweb_events" DROP COLUMN IF EXISTS "chunk";--> statement-breakpoint
ALTER TABLE "rrweb_events" DROP COLUMN IF EXISTS "chunk_index";--> statement-breakpoint
ALTER TABLE "rrweb_events" DROP COLUMN IF EXISTS "total_chunks";--> statement-breakpoint
ALTER TABLE "rrweb_events" DROP COLUMN IF EXISTS "is_chunked";--> statement-breakpoint
ALTER TABLE "rrweb_events" DROP COLUMN IF EXISTS "created_at";