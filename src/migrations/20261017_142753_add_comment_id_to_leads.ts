import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads" ADD COLUMN "comment_id" varchar;
  CREATE INDEX "leads_comment_id_idx" ON "leads" USING btree ("comment_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "leads_comment_id_idx";
  ALTER TABLE "leads" DROP COLUMN "comment_id";`)
}
