import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "stripe_account_id" varchar;
  ALTER TABLE "users" ADD COLUMN "charges_enabled" boolean DEFAULT false;
  ALTER TABLE "properties" ADD COLUMN "is_platform" boolean DEFAULT true;
  ALTER TABLE "properties" ADD COLUMN "commission_percent" numeric DEFAULT 12;
  ALTER TABLE "properties" ADD COLUMN "owner_id" integer;
  ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "properties_owner_idx" ON "properties" USING btree ("owner_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "properties" DROP CONSTRAINT "properties_owner_id_users_id_fk";
  
  DROP INDEX "properties_owner_idx";
  ALTER TABLE "users" DROP COLUMN "stripe_account_id";
  ALTER TABLE "users" DROP COLUMN "charges_enabled";
  ALTER TABLE "properties" DROP COLUMN "is_platform";
  ALTER TABLE "properties" DROP COLUMN "commission_percent";
  ALTER TABLE "properties" DROP COLUMN "owner_id";`)
}
