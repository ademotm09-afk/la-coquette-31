import { Storefront } from "@/components/store/storefront";
import { getStoreData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let data = { products: [] as any[], categories: [] as any[], rates: [] as any[] };
  try {
    data = await getStoreData();
  } catch (error) {
    console.error("Failed to load store data:", error);
  }
  return <Storefront products={data.products} categories={data.categories} rates={data.rates} />;
}
