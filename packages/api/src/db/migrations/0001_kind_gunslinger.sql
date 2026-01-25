CREATE TABLE "kindle_email_address" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"label" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kindle_email_address" ADD CONSTRAINT "kindle_email_address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kindle_email_address_userId_idx" ON "kindle_email_address" USING btree ("user_id");