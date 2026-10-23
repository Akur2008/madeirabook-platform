import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "pending_balance" numeric DEFAULT 0;
   ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "total_paid" numeric DEFAULT 0;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "referrals" DROP COLUMN IF EXISTS "pending_balance";
   ALTER TABLE "referrals" DROP COLUMN IF EXISTS "total_paid";`)
}
