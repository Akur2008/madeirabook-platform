import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "oasis_access" boolean DEFAULT false;
  CREATE INDEX IF NOT EXISTS "referrals_oasis_access_idx" ON "referrals" USING btree ("oasis_access");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "referrals_oasis_access_idx";
  ALTER TABLE "referrals" DROP COLUMN IF EXISTS "oasis_access";`)
}
