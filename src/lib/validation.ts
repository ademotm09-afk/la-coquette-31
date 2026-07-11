import { z } from "zod";

export const orderSchema = z.object({
  customer: z.object({
    fullName: z.string().min(1, "Nom requis").max(120),
    phone: z.string().regex(/^(?:0|\+213|00213)[5-7]\d{8}$/, "Numéro de téléphone invalide"),
    wilayaCode: z.coerce.number().int().min(1).max(58),
    commune: z.string().min(1, "Commune requise").max(100),
    address: z.string().min(1, "Adresse requise").max(300),
    note: z.string().max(500).optional().default(""),
    deliveryType: z.enum(["home", "office"]).default("home"),
  }),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(10),
    size: z.string().min(1),
    color: z.string().min(1),
  })).min(1, "Au moins un produit requis"),
});

export const productSchema = z.object({
  nameFr: z.string().min(1, "Nom français requis").max(200),
  nameEn: z.string().max(200).optional().default(""),
  nameAr: z.string().max(200).optional().default(""),
  categorySlug: z.string().min(1).max(100),
  descriptionFr: z.string().max(2000).optional().default(""),
  descriptionEn: z.string().max(2000).optional().default(""),
  descriptionAr: z.string().max(2000).optional().default(""),
  price: z.coerce.number().int().min(0),
  compareAtPrice: z.coerce.number().int().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  sizes: z.array(z.string()).min(1),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })).min(1),
  images: z.array(z.string().url()).min(1, "Au moins une image requise"),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const shippingRateSchema = z.object({
  code: z.coerce.number().int().min(1).max(58),
  name: z.string().min(1),
  homePrice: z.coerce.number().int().min(0),
  deskPrice: z.coerce.number().int().min(0),
  estimatedDays: z.coerce.number().int().min(1).max(30).default(3),
  active: z.boolean().default(true),
});

export const statusSchema = z.object({
  status: z.enum(["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"]),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ShippingRateInput = z.infer<typeof shippingRateSchema>;
