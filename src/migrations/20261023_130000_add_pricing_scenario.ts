import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     CREATE TYPE "public"."enum_properties_pricing_scenario" AS ENUM('smoobu', 'zeevou', 'siteminder', 'manual', 'display_only');
   EXCEPTION WHEN duplicate_object THEN NULL;
   END $$;
  ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "pricing_scenario" "enum_properties_pricing_scenario" DEFAULT 'display_only' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "properties" DROP COLUMN IF EXISTS "pricing_scenario";
  DROP TYPE IF EXISTS "public"."enum_properties_pricing_scenario";`)
}
