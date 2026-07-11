import type { Product, ShippingRate } from "@/db/schema";
import type { Lang } from "@/lib/i18n";

export type CartLine = {
  key: string;
  product: Product;
  size: string;
  color: string;
  quantity: number;
};

export type StoreCategory = {
  id: number;
  slug: string;
  nameFr: string;
  nameEn: string;
  nameAr: string;
};

export type StoreCopy = (key: string) => string;

export type StoreBaseProps = {
  lang: Lang;
  t: StoreCopy;
};

export type { Product, ShippingRate, Lang };
