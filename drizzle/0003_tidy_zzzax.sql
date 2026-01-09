CREATE TYPE "public"."order_type" AS ENUM('dine_in', 'take_away');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'transfer');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DEFAULT 'cash'::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE "public"."payment_method" USING "payment_method"::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_type" "order_type" DEFAULT 'dine_in' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "table_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_phone" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "queue_number" integer DEFAULT 1 NOT NULL;