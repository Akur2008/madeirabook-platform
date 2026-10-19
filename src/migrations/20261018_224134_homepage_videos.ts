import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_homepage_videos_category" AS ENUM('mountains', 'forest', 'ocean');
  CREATE TYPE "public"."enum_homepage_videos_slot" AS ENUM('hero', 'trio-1', 'trio-2', 'trio-3');
  CREATE TABLE "homepage_videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum_homepage_videos_category" NOT NULL,
  	"slot" "enum_homepage_videos_slot" NOT NULL,
  	"video_url" varchar NOT NULL,
  	"poster_url" varchar NOT NULL,
  	"title" varchar,
  	"is_active" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "homepage_videos_id" integer;
  CREATE INDEX "homepage_videos_updated_at_idx" ON "homepage_videos" USING btree ("updated_at");
  CREATE INDEX "homepage_videos_created_at_idx" ON "homepage_videos" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_homepage_videos_fk" FOREIGN KEY ("homepage_videos_id") REFERENCES "public"."homepage_videos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_homepage_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("homepage_videos_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage_videos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "homepage_videos" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_homepage_videos_fk";
  
  DROP INDEX "payload_locked_documents_rels_homepage_videos_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "homepage_videos_id";
  DROP TYPE "public"."enum_homepage_videos_category";
  DROP TYPE "public"."enum_homepage_videos_slot";`)
}
