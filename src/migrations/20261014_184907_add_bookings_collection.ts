import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_bookings_status" AS ENUM('pending', 'paid', 'paid_no_pms', 'cancelled', 'refunded');
  CREATE TYPE "public"."enum_bookings_source" AS ENUM('booking_channel', 'direct', 'owner_manual');
  CREATE TABLE "bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stripe_session_id" varchar,
  	"stripe_payment_intent" varchar,
  	"property_id" integer,
  	"property_slug" varchar,
  	"arrival" timestamp(3) with time zone,
  	"departure" timestamp(3) with time zone,
  	"guest_email" varchar,
  	"guest_name" varchar,
  	"guest_telegram_id" numeric,
  	"amount_total" numeric,
  	"platform_fee_cents" numeric,
  	"currency" varchar DEFAULT 'eur',
  	"status" "enum_bookings_status" DEFAULT 'pending' NOT NULL,
  	"source" "enum_bookings_source" DEFAULT 'direct',
  	"smoobu_booking_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "bookings_id" integer;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "bookings_stripe_session_id_idx" ON "bookings" USING btree ("stripe_session_id");
  CREATE INDEX "bookings_property_idx" ON "bookings" USING btree ("property_id");
  CREATE INDEX "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bookings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "bookings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_bookings_fk";
  
  DROP INDEX "payload_locked_documents_rels_bookings_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bookings_id";
  DROP TYPE "public"."enum_bookings_status";
  DROP TYPE "public"."enum_bookings_source";`)
}
