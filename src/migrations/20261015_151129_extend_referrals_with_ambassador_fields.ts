import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "referrals_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"beaches_id" integer
  );
  
  ALTER TABLE "referrals" ADD COLUMN "invitation_token" varchar;
  ALTER TABLE "referrals" ADD COLUMN "invitation_expires_at" timestamp(3) with time zone;
  ALTER TABLE "referrals" ADD COLUMN "invitation_used_at" timestamp(3) with time zone;
  ALTER TABLE "referrals" ADD COLUMN "avatar_url" varchar;
  ALTER TABLE "referrals" ADD COLUMN "bio" varchar;
  ALTER TABLE "referrals" ADD COLUMN "accent_color" varchar DEFAULT '#d4af37';
  ALTER TABLE "referrals" ADD COLUMN "display_name" varchar;
  ALTER TABLE "referrals" ADD COLUMN "source_application_id" integer;
  ALTER TABLE "referrals_rels" ADD CONSTRAINT "referrals_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."referrals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "referrals_rels" ADD CONSTRAINT "referrals_rels_beaches_fk" FOREIGN KEY ("beaches_id") REFERENCES "public"."beaches"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "referrals_rels_order_idx" ON "referrals_rels" USING btree ("order");
  CREATE INDEX "referrals_rels_parent_idx" ON "referrals_rels" USING btree ("parent_id");
  CREATE INDEX "referrals_rels_path_idx" ON "referrals_rels" USING btree ("path");
  CREATE INDEX "referrals_rels_beaches_id_idx" ON "referrals_rels" USING btree ("beaches_id");
  ALTER TABLE "referrals" ADD CONSTRAINT "referrals_source_application_id_applications_id_fk" FOREIGN KEY ("source_application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "referrals_invitation_token_idx" ON "referrals" USING btree ("invitation_token");
  CREATE INDEX "referrals_source_application_idx" ON "referrals" USING btree ("source_application_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "referrals_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "referrals_rels" CASCADE;
  ALTER TABLE "referrals" DROP CONSTRAINT "referrals_source_application_id_applications_id_fk";
  
  DROP INDEX "referrals_invitation_token_idx";
  DROP INDEX "referrals_source_application_idx";
  ALTER TABLE "referrals" DROP COLUMN "invitation_token";
  ALTER TABLE "referrals" DROP COLUMN "invitation_expires_at";
  ALTER TABLE "referrals" DROP COLUMN "invitation_used_at";
  ALTER TABLE "referrals" DROP COLUMN "avatar_url";
  ALTER TABLE "referrals" DROP COLUMN "bio";
  ALTER TABLE "referrals" DROP COLUMN "accent_color";
  ALTER TABLE "referrals" DROP COLUMN "display_name";
  ALTER TABLE "referrals" DROP COLUMN "source_application_id";`)
}
