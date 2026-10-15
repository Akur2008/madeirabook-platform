import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_restaurants_tier" AS ENUM('michelin', 'luxury', 'modern', 'heritage');
  CREATE TYPE "public"."enum_restaurants_status" AS ENUM('draft', 'published');
  CREATE TABLE "restaurants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"short_description" varchar,
  	"description" varchar,
  	"location_id" integer,
  	"address" varchar,
  	"geo_coordinates_lat" numeric NOT NULL,
  	"geo_coordinates_lng" numeric NOT NULL,
  	"cuisine" varchar,
  	"average_price" numeric,
  	"google_rating" numeric,
  	"michelin_stars" numeric DEFAULT 0,
  	"michelin_green_star" boolean DEFAULT false,
  	"michelin_recommended" boolean DEFAULT false,
  	"chef" varchar,
  	"tier" "enum_restaurants_tier" NOT NULL,
  	"booking_url" varchar,
  	"hero_image" varchar,
  	"image_attribution" varchar,
  	"status" "enum_restaurants_status" DEFAULT 'draft' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "restaurants_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "restaurants_id" integer;
  ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restaurants_texts" ADD CONSTRAINT "restaurants_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "restaurants_slug_idx" ON "restaurants" USING btree ("slug");
  CREATE INDEX "restaurants_location_idx" ON "restaurants" USING btree ("location_id");
  CREATE INDEX "restaurants_updated_at_idx" ON "restaurants" USING btree ("updated_at");
  CREATE INDEX "restaurants_created_at_idx" ON "restaurants" USING btree ("created_at");
  CREATE INDEX "restaurants_texts_order_parent" ON "restaurants_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_restaurants_fk" FOREIGN KEY ("restaurants_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_restaurants_id_idx" ON "payload_locked_documents_rels" USING btree ("restaurants_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "restaurants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "restaurants_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "restaurants" CASCADE;
  DROP TABLE "restaurants_texts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_restaurants_fk";
  
  DROP INDEX "payload_locked_documents_rels_restaurants_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "restaurants_id";
  DROP TYPE "public"."enum_restaurants_tier";
  DROP TYPE "public"."enum_restaurants_status";`)
}
