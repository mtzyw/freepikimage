ALTER TABLE "icon_generations" ADD COLUMN "svg_r2_key" varchar(500);--> statement-breakpoint
ALTER TABLE "icon_generations" ADD COLUMN "svg_r2_url" varchar(500);--> statement-breakpoint
ALTER TABLE "icon_generations" ADD COLUMN "png_r2_key" varchar(500);--> statement-breakpoint
ALTER TABLE "icon_generations" ADD COLUMN "png_r2_url" varchar(500);--> statement-breakpoint
ALTER TABLE "icon_generations" ADD COLUMN "svg_file_size" integer;--> statement-breakpoint
ALTER TABLE "icon_generations" ADD COLUMN "png_file_size" integer;