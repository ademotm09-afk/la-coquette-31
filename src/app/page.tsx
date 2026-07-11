import { Storefront } from "@/components/store/storefront";
import { getStoreData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getStoreData();
  return <Storefront products={data.products} categories={data.categories} rates={data.rates} />;
}
