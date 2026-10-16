import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_trails_difficulty" AS ENUM('easy', 'moderate', 'hard');
  CREATE TYPE "public"."enum_trails_type" AS ENUM('levada', 'vereda', 'caldeirao', 'coastal', 'peak');
  CREATE TYPE "public"."enum_trails_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_viewpoints_type" AS ENUM('cliff', 'peak', 'miradouro', 'tower', 'coastal', 'valley');
  CREATE TYPE "public"."enum_viewpoints_access" AS ENUM('car', 'walk_short', 'walk_long');
  CREATE TYPE "public"."enum_viewpoints_status" AS ENUM('draft', 'published');
  CREATE TABLE "trails_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "trails" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"pr_code" varchar,
  	"short_description" varchar,
  	"description" varchar,
  	"location_id" integer,
  	"geo_coordinates_lat" numeric NOT NULL,
  	"geo_coordinates_lng" numeric NOT NULL,
  	"end_coordinates_lat" numeric,
  	"end_coordinates_lng" numeric,
  	"distance_km" numeric,
  	"duration_minutes" numeric,
  	"elevation_gain" numeric,
  	"difficulty" "enum_trails_difficulty",
  	"type" "enum_trails_type",
  	"is_linear" boolean DEFAULT true,
  	"season" varchar,
  	"start_point" varchar,
  	"trailhead_url" varchar,
  	"hero_image" varchar,
  	"image_attribution" varchar,
  	"video_file_id" integer,
  	"poster_url" varchar,
  	"status" "enum_trails_status" DEFAULT 'draft' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "trails_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "viewpoints_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "viewpoints" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"short_description" varchar,
  	"description" varchar,
  	"location_id" integer,
  	"geo_coordinates_lat" numeric NOT NULL,
  	"geo_coordinates_lng" numeric NOT NULL,
  	"elevation_m" numeric,
  	"type" "enum_viewpoints_type",
  	"access" "enum_viewpoints_access",
  	"best_time" varchar,
  	"glass_platform" boolean DEFAULT false,
  	"hero_image" varchar,
  	"image_attribution" varchar,
  	"video_file_id" integer,
  	"poster_url" varchar,
  	"status" "enum_viewpoints_status" DEFAULT 'draft' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "viewpoints_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trails_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "viewpoints_id" integer;
  ALTER TABLE "trails_media" ADD CONSTRAINT "trails_media_image_id_uploads_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trails_media" ADD CONSTRAINT "trails_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trails"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trails" ADD CONSTRAINT "trails_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trails" ADD CONSTRAINT "trails_video_file_id_uploads_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trails_texts" ADD CONSTRAINT "trails_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trails"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "viewpoints_media" ADD CONSTRAINT "viewpoints_media_image_id_uploads_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "viewpoints_media" ADD CONSTRAINT "viewpoints_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."viewpoints"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "viewpoints" ADD CONSTRAINT "viewpoints_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "viewpoints" ADD CONSTRAINT "viewpoints_video_file_id_uploads_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "viewpoints_texts" ADD CONSTRAINT "viewpoints_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."viewpoints"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trails_media_order_idx" ON "trails_media" USING btree ("_order");
  CREATE INDEX "trails_media_parent_id_idx" ON "trails_media" USING btree ("_parent_id");
  CREATE INDEX "trails_media_image_idx" ON "trails_media" USING btree ("image_id");
  CREATE UNIQUE INDEX "trails_slug_idx" ON "trails" USING btree ("slug");
  CREATE INDEX "trails_location_idx" ON "trails" USING btree ("location_id");
  CREATE INDEX "trails_video_file_idx" ON "trails" USING btree ("video_file_id");
  CREATE INDEX "trails_updated_at_idx" ON "trails" USING btree ("updated_at");
  CREATE INDEX "trails_created_at_idx" ON "trails" USING btree ("created_at");
  CREATE INDEX "trails_texts_order_parent" ON "trails_texts" USING btree ("order","parent_id");
  CREATE INDEX "viewpoints_media_order_idx" ON "viewpoints_media" USING btree ("_order");
  CREATE INDEX "viewpoints_media_parent_id_idx" ON "viewpoints_media" USING btree ("_parent_id");
  CREATE INDEX "viewpoints_media_image_idx" ON "viewpoints_media" USING btree ("image_id");
  CREATE UNIQUE INDEX "viewpoints_slug_idx" ON "viewpoints" USING btree ("slug");
  CREATE INDEX "viewpoints_location_idx" ON "viewpoints" USING btree ("location_id");
  CREATE INDEX "viewpoints_video_file_idx" ON "viewpoints" USING btree ("video_file_id");
  CREATE INDEX "viewpoints_updated_at_idx" ON "viewpoints" USING btree ("updated_at");
  CREATE INDEX "viewpoints_created_at_idx" ON "viewpoints" USING btree ("created_at");
  CREATE INDEX "viewpoints_texts_order_parent" ON "viewpoints_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trails_fk" FOREIGN KEY ("trails_id") REFERENCES "public"."trails"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_viewpoints_fk" FOREIGN KEY ("viewpoints_id") REFERENCES "public"."viewpoints"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_trails_id_idx" ON "payload_locked_documents_rels" USING btree ("trails_id");
  CREATE INDEX "payload_locked_documents_rels_viewpoints_id_idx" ON "payload_locked_documents_rels" USING btree ("viewpoints_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trails_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trails" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trails_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "viewpoints_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "viewpoints" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "viewpoints_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "trails_media" CASCADE;
  DROP TABLE "trails" CASCADE;
  DROP TABLE "trails_texts" CASCADE;
  DROP TABLE "viewpoints_media" CASCADE;
  DROP TABLE "viewpoints" CASCADE;
  DROP TABLE "viewpoints_texts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_trails_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_viewpoints_fk";
  
  DROP INDEX "payload_locked_documents_rels_trails_id_idx";
  DROP INDEX "payload_locked_documents_rels_viewpoints_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "trails_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "viewpoints_id";
  DROP TYPE "public"."enum_trails_difficulty";
  DROP TYPE "public"."enum_trails_type";
  DROP TYPE "public"."enum_trails_status";
  DROP TYPE "public"."enum_viewpoints_type";
  DROP TYPE "public"."enum_viewpoints_access";
  DROP TYPE "public"."enum_viewpoints_status";`)
}
