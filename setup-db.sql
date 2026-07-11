-- =============================================
-- La Coquette 31 — Database Schema Setup
-- Run this in Supabase SQL Editor or any PostgreSQL client
-- =============================================

-- Enums
CREATE TYPE "order_status" AS ENUM ('new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE "delivery_type" AS ENUM ('home', 'office');

-- Categories
CREATE TABLE "categories" (
  "id" SERIAL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name_fr" TEXT NOT NULL,
  "name_en" TEXT NOT NULL,
  "name_ar" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" ("slug");

-- Products
CREATE TABLE "products" (
  "id" SERIAL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "category_slug" TEXT NOT NULL,
  "name_fr" TEXT NOT NULL,
  "name_en" TEXT NOT NULL,
  "name_ar" TEXT NOT NULL,
  "description_fr" TEXT NOT NULL,
  "description_en" TEXT NOT NULL,
  "description_ar" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "compare_at_price" INTEGER,
  "images" JSONB NOT NULL,
  "sizes" JSONB NOT NULL,
  "colors" JSONB NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "featured" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_new" BOOLEAN NOT NULL DEFAULT TRUE,
  "sales_count" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX "products_slug_idx" ON "products" ("slug");
CREATE INDEX "products_category_idx" ON "products" ("category_slug");

-- Shipping Rates
CREATE TABLE "shipping_rates" (
  "id" SERIAL PRIMARY KEY,
  "code" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "home_price" INTEGER NOT NULL,
  "desk_price" INTEGER NOT NULL,
  "estimated_days" INTEGER NOT NULL DEFAULT 3,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX "shipping_code_idx" ON "shipping_rates" ("code");

-- Orders
CREATE TABLE "orders" (
  "id" SERIAL PRIMARY KEY,
  "order_number" TEXT NOT NULL,
  "customer_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "wilaya_code" INTEGER NOT NULL,
  "wilaya_name" TEXT NOT NULL,
  "commune" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "delivery_type" "delivery_type" NOT NULL DEFAULT 'home',
  "estimated_days" INTEGER NOT NULL DEFAULT 3,
  "note" TEXT,
  "subtotal" INTEGER NOT NULL,
  "shipping_price" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "status" "order_status" NOT NULL DEFAULT 'new',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX "orders_number_idx" ON "orders" ("order_number");
CREATE INDEX "orders_phone_idx" ON "orders" ("phone");
CREATE INDEX "orders_status_idx" ON "orders" ("status");

-- Order Items
CREATE TABLE "order_items" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" INTEGER REFERENCES "products"("id") ON DELETE SET NULL,
  "product_name" TEXT NOT NULL,
  "product_image" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" INTEGER NOT NULL,
  "total" INTEGER NOT NULL
);
CREATE INDEX "order_items_order_idx" ON "order_items" ("order_id");

-- Wishlists
CREATE TABLE "wishlists" (
  "id" SERIAL PRIMARY KEY,
  "session_id" TEXT NOT NULL,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "wishlists_session_idx" ON "wishlists" ("session_id");
CREATE UNIQUE INDEX "wishlists_session_product_idx" ON "wishlists" ("session_id", "product_id");
