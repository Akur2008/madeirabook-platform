import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_referrals_payout_schedule" AS ENUM('monthly', 'weekly', 'daily', 'manual');
  CREATE TABLE "applications_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"beaches_id" integer,
  	"restaurants_id" integer
  );
  
  ALTER TABLE "referrals" ADD COLUMN "stripe_account_id" varchar;
  ALTER TABLE "referrals" ADD COLUMN "payout_schedule" "enum_referrals_payout_schedule" DEFAULT 'monthly';
  ALTER TABLE "applications_rels" ADD CONSTRAINT "applications_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "applications_rels" ADD CONSTRAINT "applications_rels_beaches_fk" FOREIGN KEY ("beaches_id") REFERENCES "public"."beaches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "applications_rels" ADD CONSTRAINT "applications_rels_restaurants_fk" FOREIGN KEY ("restaurants_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "applications_rels_order_idx" ON "applications_rels" USING btree ("order");
  CREATE INDEX "applications_rels_parent_idx" ON "applications_rels" USING btree ("parent_id");
  CREATE INDEX "applications_rels_path_idx" ON "applications_rels" USING btree ("path");
  CREATE INDEX "applications_rels_beaches_id_idx" ON "applications_rels" USING btree ("beaches_id");
  CREATE INDEX "applications_rels_restaurants_id_idx" ON "applications_rels" USING btree ("restaurants_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "applications_rels" CASCADE;
  ALTER TABLE "referrals" DROP COLUMN "stripe_account_id";
  ALTER TABLE "referrals" DROP COLUMN "payout_schedule";
  DROP TYPE "public"."enum_referrals_payout_schedule";`)
}
