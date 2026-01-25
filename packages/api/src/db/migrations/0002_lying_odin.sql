CREATE TABLE "send_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"title" text,
	"author" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"kindle_email_id" text,
	"kindle_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "send_history" ADD CONSTRAINT "send_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "send_history" ADD CONSTRAINT "send_history_kindle_email_id_kindle_email_address_id_fk" FOREIGN KEY ("kindle_email_id") REFERENCES "public"."kindle_email_address"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "send_history_userId_idx" ON "send_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "send_history_createdAt_idx" ON "send_history" USING btree ("created_at");