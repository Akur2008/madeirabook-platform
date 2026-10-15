import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_applications_audience_size" AS ENUM('5k-10k', '10k-30k', '30k-100k', '100k+');
  CREATE TYPE "public"."enum_applications_niche" AS ENUM('travel', 'lifestyle', 'portugal-madeira', 'other');
  CREATE TYPE "public"."enum_applications_status" AS ENUM('new', 'reviewing', 'approved', 'rejected');
  CREATE TABLE "applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"instagram_handle" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"audience_size" "enum_applications_audience_size" NOT NULL,
  	"niche" "enum_applications_niche" NOT NULL,
  	"main_city" varchar,
  	"sample_reel_url" varchar,
  	"message" varchar,
  	"status" "enum_applications_status" DEFAULT 'new' NOT NULL,
  	"review_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "applications_id" integer;
  CREATE INDEX "applications_email_idx" ON "applications" USING btree ("email");
  CREATE INDEX "applications_updated_at_idx" ON "applications" USING btree ("updated_at");
  CREATE INDEX "applications_created_at_idx" ON "applications" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_applications_fk" FOREIGN KEY ("applications_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("applications_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "applications" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "applications" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_applications_fk";
  
  DROP INDEX "payload_locked_documents_rels_applications_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "applications_id";
  DROP TYPE "public"."enum_applications_audience_size";
  DROP TYPE "public"."enum_applications_niche";
  DROP TYPE "public"."enum_applications_status";`)
}
