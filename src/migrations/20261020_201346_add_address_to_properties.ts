import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "address_street" varchar;
  ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "address_city" varchar;
  ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "address_postal" varchar;
  ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "address_country" varchar DEFAULT 'PT';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "properties" DROP COLUMN IF EXISTS "address_street";
  ALTER TABLE "properties" DROP COLUMN IF EXISTS "address_city";
  ALTER TABLE "properties" DROP COLUMN IF EXISTS "address_postal";
  ALTER TABLE "properties" DROP COLUMN IF EXISTS "address_country";`)
}
