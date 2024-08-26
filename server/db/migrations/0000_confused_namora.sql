CREATE TABLE IF NOT EXISTS "interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" serial NOT NULL,
	"type" text NOT NULL,
	"event" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" serial NOT NULL,
	"body" text NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"color" text,
	"favorite" boolean DEFAULT false,
	"hidden" boolean DEFAULT false,
	"sort" numeric,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"path_id" serial NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"time_on_page" numeric,
	"is_bookmarked" boolean,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interactions" ADD CONSTRAINT "interactions_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notes" ADD CONSTRAINT "notes_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pages" ADD CONSTRAINT "pages_path_id_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."paths"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "paths" ADD CONSTRAINT "paths_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "interactions_page_id_idx" ON "interactions" ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notes_page_id_idx" ON "notes" ("page_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_idx" ON "notes" ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "color_idx" ON "notes" ("color");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favorite_idx" ON "notes" ("favorite");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hidden_idx" ON "notes" ("hidden");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "url_idx" ON "pages" ("url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "domain_idx" ON "pages" ("domain");