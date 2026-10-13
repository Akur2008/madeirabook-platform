import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "house_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "properties" ADD COLUMN "description" varchar;
  ALTER TABLE "properties" ADD COLUMN "short_description" varchar;
  ALTER TABLE "properties" ADD COLUMN "size_m2" numeric;
  ALTER TABLE "properties" ADD COLUMN "bedrooms" numeric;
  ALTER TABLE "properties" ADD COLUMN "bathrooms" numeric;
  ALTER TABLE "properties" ADD COLUMN "max_guests" numeric;
  ALTER TABLE "properties" ADD COLUMN "check_in_time" varchar DEFAULT '15:00';
  ALTER TABLE "properties" ADD COLUMN "check_out_time" varchar DEFAULT '11:00';
  ALTER TABLE "properties_rels" ADD COLUMN "house_rules_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "house_rules_id" integer;
  CREATE INDEX "house_rules_updated_at_idx" ON "house_rules" USING btree ("updated_at");
  CREATE INDEX "house_rules_created_at_idx" ON "house_rules" USING btree ("created_at");
  ALTER TABLE "properties_rels" ADD CONSTRAINT "properties_rels_house_rules_fk" FOREIGN KEY ("house_rules_id") REFERENCES "public"."house_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_house_rules_fk" FOREIGN KEY ("house_rules_id") REFERENCES "public"."house_rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "properties_rels_house_rules_id_idx" ON "properties_rels" USING btree ("house_rules_id");
  CREATE INDEX "payload_locked_documents_rels_house_rules_id_idx" ON "payload_locked_documents_rels" USING btree ("house_rules_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "house_rules" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "house_rules" CASCADE;
  ALTER TABLE "properties_rels" DROP CONSTRAINT "properties_rels_house_rules_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_house_rules_fk";
  
  DROP INDEX "properties_rels_house_rules_id_idx";
  DROP INDEX "payload_locked_documents_rels_house_rules_id_idx";
  ALTER TABLE "properties" DROP COLUMN "description";
  ALTER TABLE "properties" DROP COLUMN "short_description";
  ALTER TABLE "properties" DROP COLUMN "size_m2";
  ALTER TABLE "properties" DROP COLUMN "bedrooms";
  ALTER TABLE "properties" DROP COLUMN "bathrooms";
  ALTER TABLE "properties" DROP COLUMN "max_guests";
  ALTER TABLE "properties" DROP COLUMN "check_in_time";
  ALTER TABLE "properties" DROP COLUMN "check_out_time";
  ALTER TABLE "properties_rels" DROP COLUMN "house_rules_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "house_rules_id";`)
}
