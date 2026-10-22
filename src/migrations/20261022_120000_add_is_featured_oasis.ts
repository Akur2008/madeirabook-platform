import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "beaches" ADD COLUMN IF NOT EXISTS "is_featured_oasis" boolean DEFAULT false;
  ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "is_featured_oasis" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "beaches" DROP COLUMN IF EXISTS "is_featured_oasis";
  ALTER TABLE "restaurants" DROP COLUMN IF EXISTS "is_featured_oasis";`)
}
