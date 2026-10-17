import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_properties_pms" AS ENUM('smoobu', 'zeevou');
  ALTER TABLE "properties" ADD COLUMN "pms" "enum_properties_pms";
  ALTER TABLE "properties" ADD COLUMN "pms_meta" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "properties" DROP COLUMN "pms";
  ALTER TABLE "properties" DROP COLUMN "pms_meta";
  DROP TYPE "public"."enum_properties_pms";`)
}
