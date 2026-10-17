import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_properties_hotel_type" AS ENUM('hotel', 'resort', 'boutique', 'apartment', 'villa', 'quinta');
  ALTER TYPE "public"."enum_leads_source" ADD VALUE 'oasis_inquiry';
  ALTER TABLE "properties" ADD COLUMN "hotel_type" "enum_properties_hotel_type";
  ALTER TABLE "properties" ADD COLUMN "category" varchar;
  ALTER TABLE "properties" ADD COLUMN "geo_coordinates_lat" numeric;
  ALTER TABLE "properties" ADD COLUMN "geo_coordinates_lng" numeric;
  ALTER TABLE "leads" ADD COLUMN "name" varchar;
  ALTER TABLE "leads" ADD COLUMN "dates" varchar;
  ALTER TABLE "leads" ADD COLUMN "message" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads" ALTER COLUMN "source" SET DATA TYPE text;
  DROP TYPE "public"."enum_leads_source";
  CREATE TYPE "public"."enum_leads_source" AS ENUM('whatsapp', 'instagram', 'direct_web');
  ALTER TABLE "leads" ALTER COLUMN "source" SET DATA TYPE "public"."enum_leads_source" USING "source"::"public"."enum_leads_source";
  ALTER TABLE "properties" DROP COLUMN "hotel_type";
  ALTER TABLE "properties" DROP COLUMN "category";
  ALTER TABLE "properties" DROP COLUMN "geo_coordinates_lat";
  ALTER TABLE "properties" DROP COLUMN "geo_coordinates_lng";
  ALTER TABLE "leads" DROP COLUMN "name";
  ALTER TABLE "leads" DROP COLUMN "dates";
  ALTER TABLE "leads" DROP COLUMN "message";
  DROP TYPE "public"."enum_properties_hotel_type";`)
}
