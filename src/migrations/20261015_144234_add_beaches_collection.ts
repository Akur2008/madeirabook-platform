import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_beaches_status" AS ENUM('draft', 'published');
  CREATE TABLE "beaches" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"short_description" varchar,
  	"description" varchar,
  	"location_id" integer,
  	"geo_coordinates_lat" numeric NOT NULL,
  	"geo_coordinates_lng" numeric NOT NULL,
  	"hero_image" varchar,
  	"image_attribution" varchar,
  	"best_time_to_visit" varchar,
  	"status" "enum_beaches_status" DEFAULT 'draft' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "beaches_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "beaches_id" integer;
  ALTER TABLE "beaches" ADD CONSTRAINT "beaches_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "beaches_texts" ADD CONSTRAINT "beaches_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."beaches"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "beaches_slug_idx" ON "beaches" USING btree ("slug");
  CREATE INDEX "beaches_location_idx" ON "beaches" USING btree ("location_id");
  CREATE INDEX "beaches_updated_at_idx" ON "beaches" USING btree ("updated_at");
  CREATE INDEX "beaches_created_at_idx" ON "beaches" USING btree ("created_at");
  CREATE INDEX "beaches_texts_order_parent" ON "beaches_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_beaches_fk" FOREIGN KEY ("beaches_id") REFERENCES "public"."beaches"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_beaches_id_idx" ON "payload_locked_documents_rels" USING btree ("beaches_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "beaches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "beaches_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "beaches" CASCADE;
  DROP TABLE "beaches_texts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_beaches_fk";
  
  DROP INDEX "payload_locked_documents_rels_beaches_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "beaches_id";
  DROP TYPE "public"."enum_beaches_status";`)
}
