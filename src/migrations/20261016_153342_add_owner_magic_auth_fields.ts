import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'owner', 'guest');
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'guest' NOT NULL;
  ALTER TABLE "users" ADD COLUMN "magic_token" varchar;
  ALTER TABLE "users" ADD COLUMN "magic_token_expires_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "users" DROP COLUMN "magic_token";
  ALTER TABLE "users" DROP COLUMN "magic_token_expires_at";
  DROP TYPE "public"."enum_users_role";`)
}
