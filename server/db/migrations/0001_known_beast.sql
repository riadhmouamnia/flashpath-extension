ALTER TABLE "rrweb_events" ADD COLUMN "chunk" text;--> statement-breakpoint
ALTER TABLE "rrweb_events" ADD COLUMN "chunk_index" integer;--> statement-breakpoint
ALTER TABLE "rrweb_events" ADD COLUMN "total_chunks" integer;--> statement-breakpoint
ALTER TABLE "rrweb_events" ADD COLUMN "is_chunked" boolean DEFAULT false NOT NULL;