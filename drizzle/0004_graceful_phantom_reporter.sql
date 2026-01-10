ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DEFAULT 'cash'::text;--> statement-breakpoint
DROP TYPE "public"."payment_method";--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'debit', 'qris');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DEFAULT 'cash'::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE "public"."payment_method" USING "payment_method"::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_phone" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_url" text;