import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_referrals_status" AS ENUM('active', 'paused');
  CREATE TYPE "public"."enum_affiliate_payouts_status" AS ENUM('pending', 'paid', 'cancelled');
  CREATE TABLE "referrals" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"creator_name" varchar NOT NULL,
  	"creator_email" varchar NOT NULL,
  	"commission_rate" numeric DEFAULT 2 NOT NULL,
  	"status" "enum_referrals_status" DEFAULT 'active' NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "referrals_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "affiliate_payouts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"referral_id" integer NOT NULL,
  	"booking_id" integer NOT NULL,
  	"amount_cents" numeric NOT NULL,
  	"currency" varchar DEFAULT 'EUR',
  	"status" "enum_affiliate_payouts_status" DEFAULT 'pending' NOT NULL,
  	"paid_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "referrals_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "affiliate_payouts_id" integer;
  ALTER TABLE "referrals_texts" ADD CONSTRAINT "referrals_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."referrals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "referrals_code_idx" ON "referrals" USING btree ("code");
  CREATE INDEX "referrals_updated_at_idx" ON "referrals" USING btree ("updated_at");
  CREATE INDEX "referrals_created_at_idx" ON "referrals" USING btree ("created_at");
  CREATE INDEX "referrals_texts_order_parent" ON "referrals_texts" USING btree ("order","parent_id");
  CREATE INDEX "affiliate_payouts_referral_idx" ON "affiliate_payouts" USING btree ("referral_id");
  CREATE INDEX "affiliate_payouts_booking_idx" ON "affiliate_payouts" USING btree ("booking_id");
  CREATE INDEX "affiliate_payouts_updated_at_idx" ON "affiliate_payouts" USING btree ("updated_at");
  CREATE INDEX "affiliate_payouts_created_at_idx" ON "affiliate_payouts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_referrals_fk" FOREIGN KEY ("referrals_id") REFERENCES "public"."referrals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_affiliate_payouts_fk" FOREIGN KEY ("affiliate_payouts_id") REFERENCES "public"."affiliate_payouts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_referrals_id_idx" ON "payload_locked_documents_rels" USING btree ("referrals_id");
  CREATE INDEX "payload_locked_documents_rels_affiliate_payouts_id_idx" ON "payload_locked_documents_rels" USING btree ("affiliate_payouts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "referrals" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "referrals_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "affiliate_payouts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "referrals" CASCADE;
  DROP TABLE "referrals_texts" CASCADE;
  DROP TABLE "affiliate_payouts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_referrals_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_affiliate_payouts_fk";
  
  DROP INDEX "payload_locked_documents_rels_referrals_id_idx";
  DROP INDEX "payload_locked_documents_rels_affiliate_payouts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "referrals_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "affiliate_payouts_id";
  DROP TYPE "public"."enum_referrals_status";
  DROP TYPE "public"."enum_affiliate_payouts_status";`)
}
