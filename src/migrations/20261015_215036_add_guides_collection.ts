import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guides_category" AS ENUM('gastronomy', 'lifestyle', 'logistics', 'spots', 'history');
  CREATE TYPE "public"."enum_guides_status" AS ENUM('draft', 'published');
  CREATE TABLE "guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"cover_image_id" integer,
  	"content" jsonb,
  	"excerpt" varchar,
  	"category" "enum_guides_category",
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"status" "enum_guides_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "guides_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"restaurants_id" integer,
  	"beaches_id" integer,
  	"properties_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guides_id" integer;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_cover_image_id_uploads_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_seo_image_id_uploads_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_restaurants_fk" FOREIGN KEY ("restaurants_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_beaches_fk" FOREIGN KEY ("beaches_id") REFERENCES "public"."beaches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_properties_fk" FOREIGN KEY ("properties_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "guides_slug_idx" ON "guides" USING btree ("slug");
  CREATE INDEX "guides_cover_image_idx" ON "guides" USING btree ("cover_image_id");
  CREATE INDEX "guides_seo_seo_image_idx" ON "guides" USING btree ("seo_image_id");
  CREATE INDEX "guides_updated_at_idx" ON "guides" USING btree ("updated_at");
  CREATE INDEX "guides_created_at_idx" ON "guides" USING btree ("created_at");
  CREATE INDEX "guides_rels_order_idx" ON "guides_rels" USING btree ("order");
  CREATE INDEX "guides_rels_parent_idx" ON "guides_rels" USING btree ("parent_id");
  CREATE INDEX "guides_rels_path_idx" ON "guides_rels" USING btree ("path");
  CREATE INDEX "guides_rels_restaurants_id_idx" ON "guides_rels" USING btree ("restaurants_id");
  CREATE INDEX "guides_rels_beaches_id_idx" ON "guides_rels" USING btree ("beaches_id");
  CREATE INDEX "guides_rels_properties_id_idx" ON "guides_rels" USING btree ("properties_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("guides_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guides" CASCADE;
  DROP TABLE "guides_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guides_fk";
  
  DROP INDEX "payload_locked_documents_rels_guides_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guides_id";
  DROP TYPE "public"."enum_guides_category";
  DROP TYPE "public"."enum_guides_status";`)
}
