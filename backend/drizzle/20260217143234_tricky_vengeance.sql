CREATE TABLE "speaker_presentations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"speaker_id" text NOT NULL,
	"speaker_name" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "speaker_presentations_speaker_id_idx" ON "speaker_presentations" USING btree ("speaker_id");--> statement-breakpoint
CREATE INDEX "speaker_presentations_created_at_idx" ON "speaker_presentations" USING btree ("created_at");