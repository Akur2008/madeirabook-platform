import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_leads_type" AS ENUM('ambassador', 'owner');
  ALTER TABLE "leads" ADD COLUMN "type" "enum_leads_type";
  ALTER TABLE "leads" ADD COLUMN "whatsapp" varchar;
  ALTER TABLE "leads" ADD COLUMN "instagram_or_property" varchar;
  CREATE INDEX "leads_type_idx" ON "leads" USING btree ("type");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "leads_type_idx";
  ALTER TABLE "leads" DROP COLUMN "type";
  ALTER TABLE "leads" DROP COLUMN "whatsapp";
  ALTER TABLE "leads" DROP COLUMN "instagram_or_property";
  DROP TYPE "public"."enum_leads_type";`)
}
