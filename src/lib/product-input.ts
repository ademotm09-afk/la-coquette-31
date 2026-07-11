import type { NewProduct, ProductColor } from "@/db/schema";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function productInput(body: Record<string, unknown>): NewProduct {
  const nameFr = String(body.nameFr || "").trim();
  const images = Array.isArray(body.images)
    ? body.images.map(String).filter(Boolean)
    : String(body.images || "").split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
  const sizes = Array.isArray(body.sizes)
    ? body.sizes.map(String).filter(Boolean)
    : String(body.sizes || "S,M,L,XL").split(",").map((item) => item.trim()).filter(Boolean);
  const colors: ProductColor[] = Array.isArray(body.colors) && body.colors.length
    ? (body.colors as ProductColor[])
    : [{ name: "Noisette", hex: "#8A6851" }];

  if (!nameFr || !images.length || !Number(body.price)) throw new Error("Données produit incomplètes");

  return {
    slug: slugify(String(body.slug || nameFr)),
    categorySlug: String(body.categorySlug || "robes"),
    nameFr,
    nameEn: String(body.nameEn || nameFr),
    nameAr: String(body.nameAr || nameFr),
    descriptionFr: String(body.descriptionFr || "Pièce élégante de la collection La Coquette."),
    descriptionEn: String(body.descriptionEn || body.descriptionFr || "An elegant piece from La Coquette."),
    descriptionAr: String(body.descriptionAr || body.descriptionFr || "قطعة أنيقة من لا كوكيت."),
    price: Math.max(0, Number(body.price)),
    compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
    images,
    sizes,
    colors,
    stock: Math.max(0, Number(body.stock || 0)),
    featured: Boolean(body.featured),
    isNew: body.isNew === undefined ? true : Boolean(body.isNew),
    active: body.active === undefined ? true : Boolean(body.active),
    updatedAt: new Date(),
  };
}
