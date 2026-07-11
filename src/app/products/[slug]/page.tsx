import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Storefront } from "@/components/store/storefront";
import { getProductBySlug, getStoreData } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (!result) return { title: "Produit introuvable | La Coquette" };
  return {
    title: `${result.product.nameFr} | La Coquette`,
    description: result.product.descriptionFr.slice(0, 155),
    openGraph: { title: result.product.nameFr, description: result.product.descriptionFr, images: [result.product.images[0]], type: "website", locale: "fr_DZ" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [result, store] = await Promise.all([getProductBySlug(slug), getStoreData()]);
  if (!result) notFound();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: result.product.nameFr,
    image: result.product.images,
    description: result.product.descriptionFr,
    brand: { "@type": "Brand", name: "La Coquette" },
    offers: { "@type": "Offer", priceCurrency: "DZD", price: result.product.price, availability: result.product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <Storefront products={store.products} categories={store.categories} rates={store.rates} focusProduct={result.product} related={result.related} />
    </>
  );
}
