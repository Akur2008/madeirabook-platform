import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_unit_types_status" AS ENUM('active', 'draft');
  CREATE TYPE "public"."enum_units_status" AS ENUM('active', 'draft');
  CREATE TYPE "public"."enum_rate_plans_status" AS ENUM('active', 'draft');
  CREATE TABLE "unit_types_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "unit_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"property_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"capacity" numeric DEFAULT 2,
  	"bedrooms" numeric DEFAULT 1,
  	"bathrooms" numeric DEFAULT 1,
  	"description" varchar,
  	"external_id" varchar,
  	"status" "enum_unit_types_status" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "units" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"unit_type_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"external_id" varchar,
  	"status" "enum_units_status" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rate_plans" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"unit_type_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"base_price" numeric NOT NULL,
  	"min_nights" numeric DEFAULT 1,
  	"includes_breakfast" boolean DEFAULT false,
  	"external_id" varchar,
  	"status" "enum_rate_plans_status" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "unit_types_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "units_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rate_plans_id" integer;
  ALTER TABLE "unit_types_photos" ADD CONSTRAINT "unit_types_photos_image_id_uploads_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "unit_types_photos" ADD CONSTRAINT "unit_types_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."unit_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "unit_types" ADD CONSTRAINT "unit_types_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "units" ADD CONSTRAINT "units_unit_type_id_unit_types_id_fk" FOREIGN KEY ("unit_type_id") REFERENCES "public"."unit_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_unit_type_id_unit_types_id_fk" FOREIGN KEY ("unit_type_id") REFERENCES "public"."unit_types"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "unit_types_photos_order_idx" ON "unit_types_photos" USING btree ("_order");
  CREATE INDEX "unit_types_photos_parent_id_idx" ON "unit_types_photos" USING btree ("_parent_id");
  CREATE INDEX "unit_types_photos_image_idx" ON "unit_types_photos" USING btree ("image_id");
  CREATE INDEX "unit_types_property_idx" ON "unit_types" USING btree ("property_id");
  CREATE INDEX "unit_types_updated_at_idx" ON "unit_types" USING btree ("updated_at");
  CREATE INDEX "unit_types_created_at_idx" ON "unit_types" USING btree ("created_at");
  CREATE INDEX "units_unit_type_idx" ON "units" USING btree ("unit_type_id");
  CREATE INDEX "units_updated_at_idx" ON "units" USING btree ("updated_at");
  CREATE INDEX "units_created_at_idx" ON "units" USING btree ("created_at");
  CREATE INDEX "rate_plans_unit_type_idx" ON "rate_plans" USING btree ("unit_type_id");
  CREATE INDEX "rate_plans_updated_at_idx" ON "rate_plans" USING btree ("updated_at");
  CREATE INDEX "rate_plans_created_at_idx" ON "rate_plans" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_unit_types_fk" FOREIGN KEY ("unit_types_id") REFERENCES "public"."unit_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_units_fk" FOREIGN KEY ("units_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_plans_fk" FOREIGN KEY ("rate_plans_id") REFERENCES "public"."rate_plans"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_unit_types_id_idx" ON "payload_locked_documents_rels" USING btree ("unit_types_id");
  CREATE INDEX "payload_locked_documents_rels_units_id_idx" ON "payload_locked_documents_rels" USING btree ("units_id");
  CREATE INDEX "payload_locked_documents_rels_rate_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_plans_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "unit_types_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "unit_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "units" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rate_plans" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "unit_types_photos" CASCADE;
  DROP TABLE "unit_types" CASCADE;
  DROP TABLE "units" CASCADE;
  DROP TABLE "rate_plans" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_unit_types_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_units_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rate_plans_fk";
  
  DROP INDEX "payload_locked_documents_rels_unit_types_id_idx";
  DROP INDEX "payload_locked_documents_rels_units_id_idx";
  DROP INDEX "payload_locked_documents_rels_rate_plans_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "unit_types_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "units_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rate_plans_id";
  DROP TYPE "public"."enum_unit_types_status";
  DROP TYPE "public"."enum_units_status";
  DROP TYPE "public"."enum_rate_plans_status";`)
}
