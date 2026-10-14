import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "email_queue" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subscriber_id" integer NOT NULL,
  	"template" varchar NOT NULL,
  	"send_at" timestamp(3) with time zone NOT NULL,
  	"sent_at" timestamp(3) with time zone,
  	"error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "subscribers" ADD COLUMN "unsubscribe_token" varchar;
  ALTER TABLE "subscribers" ADD COLUMN "unsubscribed_at" timestamp(3) with time zone;
  ALTER TABLE "subscribers" ADD COLUMN "telegram_id" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_queue_id" integer;
  ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "email_queue_subscriber_idx" ON "email_queue" USING btree ("subscriber_id");
  CREATE INDEX "email_queue_send_at_idx" ON "email_queue" USING btree ("send_at");
  CREATE INDEX "email_queue_sent_at_idx" ON "email_queue" USING btree ("sent_at");
  CREATE INDEX "email_queue_updated_at_idx" ON "email_queue" USING btree ("updated_at");
  CREATE INDEX "email_queue_created_at_idx" ON "email_queue" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_queue_fk" FOREIGN KEY ("email_queue_id") REFERENCES "public"."email_queue"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "subscribers_unsubscribe_token_idx" ON "subscribers" USING btree ("unsubscribe_token");
  CREATE INDEX "subscribers_unsubscribed_at_idx" ON "subscribers" USING btree ("unsubscribed_at");
  CREATE INDEX "payload_locked_documents_rels_email_queue_id_idx" ON "payload_locked_documents_rels" USING btree ("email_queue_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "email_queue" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "email_queue" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_email_queue_fk";
  
  DROP INDEX "subscribers_unsubscribe_token_idx";
  DROP INDEX "subscribers_unsubscribed_at_idx";
  DROP INDEX "payload_locked_documents_rels_email_queue_id_idx";
  ALTER TABLE "subscribers" DROP COLUMN "unsubscribe_token";
  ALTER TABLE "subscribers" DROP COLUMN "unsubscribed_at";
  ALTER TABLE "subscribers" DROP COLUMN "telegram_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "email_queue_id";`)
}
