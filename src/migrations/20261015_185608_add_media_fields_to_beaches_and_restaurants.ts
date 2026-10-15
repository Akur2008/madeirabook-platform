import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "beaches_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "restaurants_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  ALTER TABLE "beaches" ADD COLUMN "video_file_id" integer;
  ALTER TABLE "beaches" ADD COLUMN "poster_url" varchar;
  ALTER TABLE "restaurants" ADD COLUMN "video_file_id" integer;
  ALTER TABLE "restaurants" ADD COLUMN "poster_url" varchar;
  ALTER TABLE "beaches_media" ADD CONSTRAINT "beaches_media_image_id_uploads_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "beaches_media" ADD CONSTRAINT "beaches_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."beaches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "restaurants_media" ADD CONSTRAINT "restaurants_media_image_id_uploads_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restaurants_media" ADD CONSTRAINT "restaurants_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "beaches_media_order_idx" ON "beaches_media" USING btree ("_order");
  CREATE INDEX "beaches_media_parent_id_idx" ON "beaches_media" USING btree ("_parent_id");
  CREATE INDEX "beaches_media_image_idx" ON "beaches_media" USING btree ("image_id");
  CREATE INDEX "restaurants_media_order_idx" ON "restaurants_media" USING btree ("_order");
  CREATE INDEX "restaurants_media_parent_id_idx" ON "restaurants_media" USING btree ("_parent_id");
  CREATE INDEX "restaurants_media_image_idx" ON "restaurants_media" USING btree ("image_id");
  ALTER TABLE "beaches" ADD CONSTRAINT "beaches_video_file_id_uploads_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_video_file_id_uploads_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "beaches_video_file_idx" ON "beaches" USING btree ("video_file_id");
  CREATE INDEX "restaurants_video_file_idx" ON "restaurants" USING btree ("video_file_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "beaches_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "restaurants_media" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "beaches_media" CASCADE;
  DROP TABLE "restaurants_media" CASCADE;
  ALTER TABLE "beaches" DROP CONSTRAINT "beaches_video_file_id_uploads_id_fk";
  
  ALTER TABLE "restaurants" DROP CONSTRAINT "restaurants_video_file_id_uploads_id_fk";
  
  DROP INDEX "beaches_video_file_idx";
  DROP INDEX "restaurants_video_file_idx";
  ALTER TABLE "beaches" DROP COLUMN "video_file_id";
  ALTER TABLE "beaches" DROP COLUMN "poster_url";
  ALTER TABLE "restaurants" DROP COLUMN "video_file_id";
  ALTER TABLE "restaurants" DROP COLUMN "poster_url";`)
}
