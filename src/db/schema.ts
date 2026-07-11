import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const deliveryTypeEnum = pgEnum("delivery_type", ["home", "office"]);

export type ProductColor = { name: string; hex: string };

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    nameFr: text("name_fr").notNull(),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)],
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    categorySlug: text("category_slug").notNull(),
    nameFr: text("name_fr").notNull(),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    descriptionFr: text("description_fr").notNull(),
    descriptionEn: text("description_en").notNull(),
    descriptionAr: text("description_ar").notNull(),
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    images: jsonb("images").$type<string[]>().notNull(),
    sizes: jsonb("sizes").$type<string[]>().notNull(),
    colors: jsonb("colors").$type<ProductColor[]>().notNull(),
    stock: integer("stock").default(0).notNull(),
    featured: boolean("featured").default(false).notNull(),
    isNew: boolean("is_new").default(true).notNull(),
    salesCount: integer("sales_count").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    index("products_category_idx").on(table.categorySlug),
  ],
);

export const shippingRates = pgTable(
  "shipping_rates",
  {
    id: serial("id").primaryKey(),
    code: integer("code").notNull(),
    name: text("name").notNull(),
    homePrice: integer("home_price").notNull(),
    deskPrice: integer("desk_price").notNull(),
    estimatedDays: integer("estimated_days").default(3).notNull(),
    active: boolean("active").default(true).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("shipping_code_idx").on(table.code)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: text("order_number").notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    wilayaCode: integer("wilaya_code").notNull(),
    wilayaName: text("wilaya_name").notNull(),
    commune: text("commune").notNull(),
    address: text("address").notNull(),
    deliveryType: deliveryTypeEnum("delivery_type").default("home").notNull(),
    estimatedDays: integer("estimated_days").default(3).notNull(),
    note: text("note"),
    subtotal: integer("subtotal").notNull(),
    shippingPrice: integer("shipping_price").notNull(),
    total: integer("total").notNull(),
    status: orderStatusEnum("status").default("new").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("orders_number_idx").on(table.orderNumber),
    index("orders_phone_idx").on(table.phone),
    index("orders_status_idx").on(table.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    productImage: text("product_image").notNull(),
    size: text("size").notNull(),
    color: text("color").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    total: integer("total").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const wishlists = pgTable(
  "wishlists",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("wishlists_session_idx").on(table.sessionId),
    uniqueIndex("wishlists_session_product_idx").on(table.sessionId, table.productId),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ShippingRate = typeof shippingRates.$inferSelect;
export type Wishlist = typeof wishlists.$inferSelect;
