ALTER TABLE "user" ALTER COLUMN "opt_in_networking" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "share_email" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "share_phone" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "share_linked_in" boolean DEFAULT true NOT NULL;