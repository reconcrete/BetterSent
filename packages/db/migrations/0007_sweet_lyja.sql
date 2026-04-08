CREATE TABLE "reference" (
	"id" text PRIMARY KEY NOT NULL,
	"history_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reference" ADD CONSTRAINT "reference_history_id_send_history_id_fk" FOREIGN KEY ("history_id") REFERENCES "public"."send_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reference_historyId_idx" ON "reference" USING btree ("history_id");