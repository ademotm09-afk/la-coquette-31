"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import { motion } from "motion/react";
import { localizedProduct, money } from "@/lib/i18n";
import type { Lang, Product, StoreCopy } from "./types";

type Props = {
  product: Product;
  lang: Lang;
  t: StoreCopy;
  wished: boolean;
  onWish: (id: number) => void;
  onQuick: (product: Product) => void;
  priority?: boolean;
};

export function ProductCard({ product, lang, t, wished, onWish, onQuick, priority }: Props) {
  const copy = localizedProduct(product, lang);
  const discount = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
      className="group min-w-0"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-[#eee5da] sm:rounded-[24px]">
        <Link href={`/products/${product.slug}`} aria-label={copy.name} className="absolute inset-0 z-[1]">
          <Image
            src={product.images[0]}
            alt={copy.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
          />
        </Link>
        <div className="absolute start-2 top-2 z-10 flex flex-col items-start gap-1.5 sm:start-3 sm:top-3">
          {product.isNew && <span className="rounded-full bg-white/92 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.13em] text-[#5a3d2e] shadow-sm backdrop-blur sm:text-[10px]">{t("new")}</span>}
          {discount > 0 && <span className="rounded-full bg-[#6f4e37] px-2.5 py-1 text-[9px] font-bold tracking-[.08em] text-white shadow-sm sm:text-[10px]">−{discount}%</span>}
        </div>
        <button
          type="button"
          onClick={() => onWish(product.id)}
          aria-label={wished ? t("removeWishlist") : t("addWishlist")}
          aria-pressed={wished}
          className="absolute end-2 top-2 z-20 grid size-10 place-items-center rounded-full bg-white/90 text-[#4d342a] shadow-[0_5px_18px_rgba(62,39,35,.11)] backdrop-blur transition hover:bg-white active:scale-95 sm:end-3 sm:top-3"
        >
          <Heart size={18} strokeWidth={1.7} fill={wished ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={() => onQuick(product)}
          className="absolute bottom-3 start-1/2 z-20 hidden h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white/95 px-5 text-xs font-bold uppercase tracking-[.1em] text-[#4a3027] opacity-0 shadow-lg backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex sm:translate-y-2"
        >
          <Eye size={16} /> {t("quickView")}
        </button>
        <button
          type="button"
          onClick={() => onQuick(product)}
          aria-label={t("quickView")}
          className="absolute bottom-2 end-2 z-20 grid size-10 place-items-center rounded-full bg-white/92 text-[#4d342a] shadow-md sm:hidden"
        >
          <Eye size={17} />
        </button>
      </div>
      <div className="px-0.5 pb-2 pt-3 sm:pt-4">
        <Link href={`/products/${product.slug}`} className="block truncate text-[13px] font-medium leading-tight text-[#3e2723] transition hover:text-[#8a6145] sm:text-[15px]">
          {copy.name}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[13px] font-bold tracking-tight text-[#6f4e37] sm:text-sm">{money(product.price, lang)}</span>
          {product.compareAtPrice && <span className="text-[11px] text-[#a39083] line-through sm:text-xs">{money(product.compareAtPrice, lang)}</span>}
        </div>
      </div>
    </motion.article>
  );
}
