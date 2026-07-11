"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, Expand, Minus, Plus, ShoppingBag, X, ZoomIn } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { localizedProduct, money } from "@/lib/i18n";
import type { Lang, Product, StoreCopy } from "./types";

type Props = {
  product: Product;
  lang: Lang;
  t: StoreCopy;
  compact?: boolean;
  onAdd: (product: Product, size: string, color: string, quantity: number) => void;
  onClose?: () => void;
};

export function ProductView({ product, lang, t, compact = false, onAdd, onClose }: Props) {
  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState(product.colors[0]?.name || "");
  const [quantity, setQuantity] = useState(1);
  const [gallery, setGallery] = useState(false);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);
  const copy = localizedProduct(product, lang);
  const discount = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  useEffect(() => {
    setImageIndex(0);
    setSize("");
    setColor(product.colors[0]?.name || "");
    setQuantity(1);
    setError(false);
  }, [product]);

  const add = () => {
    if (!size) {
      setError(true);
      return;
    }
    onAdd(product, size, color, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <>
      <div className={`grid min-w-0 gap-6 ${compact ? "md:grid-cols-[.95fr_1.05fr] md:gap-8" : "lg:grid-cols-[minmax(0,1.18fr)_minmax(350px,.82fr)] lg:gap-14"}`}>
        <section className="min-w-0" aria-label={t("fullscreen")}>
          <div className={`grid gap-3 ${product.images.length > 1 ? "grid-cols-[58px_1fr] sm:grid-cols-[72px_1fr]" : "grid-cols-1"}`}>
            {product.images.length > 1 && (
              <div className="flex flex-col gap-2">
                {product.images.slice(0, 5).map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setImageIndex(index)}
                    aria-label={`${copy.name} ${index + 1}`}
                    className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition ${imageIndex === index ? "border-[#6f4e37]" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <Image src={image} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setGallery(true)}
              className={`group relative min-w-0 overflow-hidden rounded-[22px] bg-[#eee4d8] text-start ${compact ? "aspect-[3/4] max-h-[68vh]" : "aspect-[3/4] max-h-[78vh]"}`}
              aria-label={`${t("zoom")}: ${copy.name}`}
            >
              <Image src={product.images[imageIndex] || product.images[0]} alt={copy.name} fill priority={!compact} sizes={compact ? "(max-width: 768px) 80vw, 40vw" : "(max-width: 1024px) 100vw, 55vw"} className="object-cover transition duration-700 group-hover:scale-[1.025]" />
              <span className="absolute bottom-3 end-3 grid size-11 place-items-center rounded-full bg-white/90 text-[#5d4032] shadow-lg backdrop-blur transition group-hover:scale-105">
                <Expand size={18} />
              </span>
            </button>
          </div>
        </section>

        <section className={`${compact ? "py-1" : "lg:sticky lg:top-32 lg:self-start lg:py-5"}`}>
          <div className="mb-3 flex items-center gap-2">
            {product.isNew && <span className="rounded-full bg-[#eee3d6] px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#6f4e37]">{t("new")}</span>}
            {discount > 0 && <span className="rounded-full bg-[#6f4e37] px-3 py-1 text-[10px] font-bold text-white">−{discount}%</span>}
          </div>
          <h1 className={`font-serif font-medium leading-[1.05] text-[#3e2723] ${compact ? "text-3xl sm:text-4xl" : "text-[2.25rem] sm:text-5xl"}`}>{copy.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-lg font-bold text-[#6f4e37]">{money(product.price, lang)}</span>
            {product.compareAtPrice && <span className="text-sm text-[#9a887b] line-through">{money(product.compareAtPrice, lang)}</span>}
          </div>
          {!compact && <p className="mt-5 text-sm leading-7 text-[#715f56]">{copy.description}</p>}

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[.12em] text-[#4a3027]">{t("color")}: <span className="font-medium normal-case tracking-normal text-[#78665c]">{color}</span></span>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setColor(item.name)}
                  aria-label={item.name}
                  aria-pressed={color === item.name}
                  className={`grid size-11 place-items-center rounded-full border transition ${color === item.name ? "border-[#6f4e37] shadow-[0_0_0_3px_white_inset]" : "border-[#dfd4c8]"}`}
                  style={{ backgroundColor: item.hex }}
                >
                  {color === item.name && <Check size={15} className={item.hex.toLowerCase() === "#5a3d2e" ? "text-white" : "text-[#3e2723]"} />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[.12em] text-[#4a3027]">{t("size")}</span>
              <span className={`text-xs ${product.stock < 10 ? "text-[#9a5f45]" : "text-[#7e725f]"}`}>{product.stock < 10 ? t("lowStock") : t("stock")}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.sizes.map((item) => (
                <button key={item} onClick={() => { setSize(item); setError(false); }} className={`h-12 rounded-xl border text-sm font-semibold transition ${size === item ? "border-[#6f4e37] bg-[#6f4e37] text-white" : "border-[#ded3c8] bg-white text-[#51382d] hover:border-[#8b6a55]"}`}>{item}</button>
              ))}
            </div>
            {error && <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-2 text-xs font-medium text-[#a14f38]">{t("chooseSize")}</motion.p>}
          </div>

          <div className="mt-6 flex gap-2.5">
            <div className="flex h-13 shrink-0 items-center rounded-2xl border border-[#ddd1c5] bg-white p-1">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="−" className="grid size-10 place-items-center rounded-xl hover:bg-[#f5efe6]"><Minus size={15} /></button>
              <span className="w-8 text-center text-sm font-bold">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(10, quantity + 1))} aria-label="+" className="grid size-10 place-items-center rounded-xl hover:bg-[#f5efe6]"><Plus size={15} /></button>
            </div>
            <button onClick={add} disabled={product.stock < 1} className="flex h-13 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#65442f] to-[#856047] px-4 text-sm font-bold text-white shadow-[0_12px_26px_rgba(85,56,40,.2)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(85,56,40,.26)] active:translate-y-0 disabled:opacity-50">
              {added ? <><Check size={18} /> {t("added")}</> : <><ShoppingBag size={18} /> {t("addCart")}</>}
            </button>
          </div>

          {compact && <Link onClick={onClose} href={`/products/${product.slug}`} className="mt-4 flex h-12 items-center justify-center rounded-2xl border border-[#d8c9bd] text-xs font-bold uppercase tracking-[.1em] text-[#604434] transition hover:bg-[#f5efe6]">{t("details")}</Link>}

          <div className="mt-7 divide-y divide-[#e9e0d7] border-y border-[#e9e0d7]">
            {!compact && (
              <details className="group py-4" open>
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#4b3329]">{t("description")}<ChevronDown size={17} className="transition group-open:rotate-180" /></summary>
                <p className="pt-3 text-sm leading-7 text-[#75645a]">{copy.description}</p>
              </details>
            )}
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#4b3329]">{t("deliveryInfo")}<ChevronDown size={17} className="transition group-open:rotate-180" /></summary>
              <p className="pt-3 text-sm leading-7 text-[#75645a]">{t("deliveryText")}</p>
            </details>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {gallery && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#291b17]/95 p-3 sm:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={t("fullscreen")}>
            <button onClick={() => setGallery(false)} aria-label={t("close")} className="absolute end-4 top-4 z-20 grid size-12 place-items-center rounded-full bg-white/12 text-white backdrop-blur hover:bg-white/20"><X size={22} /></button>
            <div className="group relative h-full w-full max-w-5xl cursor-zoom-in overflow-hidden rounded-2xl">
              <Image src={product.images[imageIndex] || product.images[0]} alt={copy.name} fill sizes="100vw" className="object-contain transition-transform duration-500 group-hover:scale-[1.4]" />
              <ZoomIn className="absolute bottom-4 start-4 text-white/70" size={20} />
            </div>
            {product.images.length > 1 && <div className="absolute bottom-5 start-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-[#241815]/70 p-2 backdrop-blur">{product.images.map((image, index) => <button key={image} onClick={() => setImageIndex(index)} className={`size-2.5 rounded-full transition ${index === imageIndex ? "bg-white" : "bg-white/35"}`} aria-label={`${index + 1}`} />)}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
