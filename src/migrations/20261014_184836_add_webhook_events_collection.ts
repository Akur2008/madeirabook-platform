import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_webhook_events_status" AS ENUM('processed', 'failed');
  CREATE TABLE "webhook_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" varchar NOT NULL,
  	"event_type" varchar NOT NULL,
  	"payload" jsonb,
  	"processed_at" timestamp(3) with time zone NOT NULL,
  	"status" "enum_webhook_events_status" DEFAULT 'processed' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "webhook_events_id" integer;
  CREATE UNIQUE INDEX "webhook_events_event_id_idx" ON "webhook_events" USING btree ("event_id");
  CREATE INDEX "webhook_events_updated_at_idx" ON "webhook_events" USING btree ("updated_at");
  CREATE INDEX "webhook_events_created_at_idx" ON "webhook_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_webhook_events_fk" FOREIGN KEY ("webhook_events_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_webhook_events_id_idx" ON "payload_locked_documents_rels" USING btree ("webhook_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "webhook_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "webhook_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_webhook_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_webhook_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "webhook_events_id";
  DROP TYPE "public"."enum_webhook_events_status";`)
}
