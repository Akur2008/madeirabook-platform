import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "has_active_subscription" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN IF EXISTS "stripe_customer_id";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "has_active_subscription";`)
}
