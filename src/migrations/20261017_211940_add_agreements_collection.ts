import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_agreements_role" AS ENUM('owner', 'ambassador');
  CREATE TYPE "public"."enum_agreements_document_type" AS ENUM('owner_terms', 'ambassador_terms');
  CREATE TABLE "agreements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"referral_id" integer,
  	"role" "enum_agreements_role" NOT NULL,
  	"document_type" "enum_agreements_document_type" NOT NULL,
  	"document_version" varchar,
  	"signed_name" varchar,
  	"ip_address" varchar,
  	"signed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "agreements_id" integer;
  ALTER TABLE "agreements" ADD CONSTRAINT "agreements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agreements" ADD CONSTRAINT "agreements_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "agreements_user_idx" ON "agreements" USING btree ("user_id");
  CREATE INDEX "agreements_referral_idx" ON "agreements" USING btree ("referral_id");
  CREATE INDEX "agreements_updated_at_idx" ON "agreements" USING btree ("updated_at");
  CREATE INDEX "agreements_created_at_idx" ON "agreements" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agreements_fk" FOREIGN KEY ("agreements_id") REFERENCES "public"."agreements"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_agreements_id_idx" ON "payload_locked_documents_rels" USING btree ("agreements_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "agreements" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "agreements" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agreements_fk";
  
  DROP INDEX "payload_locked_documents_rels_agreements_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agreements_id";
  DROP TYPE "public"."enum_agreements_role";
  DROP TYPE "public"."enum_agreements_document_type";`)
}
