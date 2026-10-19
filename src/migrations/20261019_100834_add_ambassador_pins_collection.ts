import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ambassador_pins_category" AS ENUM('beach', 'restaurant', 'viewpoint', 'other');
  CREATE TYPE "public"."enum_ambassador_pins_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TABLE "ambassador_pins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"referral_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"category" "enum_ambassador_pins_category" NOT NULL,
  	"coordinates_lat" numeric NOT NULL,
  	"coordinates_lng" numeric NOT NULL,
  	"description" varchar,
  	"photo_id" integer,
  	"video_id" integer,
  	"status" "enum_ambassador_pins_status" DEFAULT 'pending' NOT NULL,
  	"promoted_to_global" boolean DEFAULT false,
  	"moderation_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ambassador_pins_id" integer;
  ALTER TABLE "ambassador_pins" ADD CONSTRAINT "ambassador_pins_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ambassador_pins" ADD CONSTRAINT "ambassador_pins_photo_id_uploads_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ambassador_pins" ADD CONSTRAINT "ambassador_pins_video_id_uploads_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ambassador_pins_referral_idx" ON "ambassador_pins" USING btree ("referral_id");
  CREATE INDEX "ambassador_pins_photo_idx" ON "ambassador_pins" USING btree ("photo_id");
  CREATE INDEX "ambassador_pins_video_idx" ON "ambassador_pins" USING btree ("video_id");
  CREATE INDEX "ambassador_pins_updated_at_idx" ON "ambassador_pins" USING btree ("updated_at");
  CREATE INDEX "ambassador_pins_created_at_idx" ON "ambassador_pins" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ambassador_pins_fk" FOREIGN KEY ("ambassador_pins_id") REFERENCES "public"."ambassador_pins"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_ambassador_pins_id_idx" ON "payload_locked_documents_rels" USING btree ("ambassador_pins_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ambassador_pins" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ambassador_pins" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ambassador_pins_fk";
  
  DROP INDEX "payload_locked_documents_rels_ambassador_pins_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ambassador_pins_id";
  DROP TYPE "public"."enum_ambassador_pins_category";
  DROP TYPE "public"."enum_ambassador_pins_status";`)
}
