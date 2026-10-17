import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "referrals_rels" ADD COLUMN "restaurants_id" integer;
  ALTER TABLE "referrals_rels" ADD CONSTRAINT "referrals_rels_restaurants_fk" FOREIGN KEY ("restaurants_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "referrals_rels_restaurants_id_idx" ON "referrals_rels" USING btree ("restaurants_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "referrals_rels" DROP CONSTRAINT "referrals_rels_restaurants_fk";
  
  DROP INDEX "referrals_rels_restaurants_id_idx";
  ALTER TABLE "referrals_rels" DROP COLUMN "restaurants_id";`)
}
