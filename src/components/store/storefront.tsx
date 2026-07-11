"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, ChevronDown, ChevronLeft, ChevronRight, Filter, Heart, Menu, Search, ShoppingBag, SlidersHorizontal, Sparkles, Truck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CartDrawer } from "./cart-drawer";
import { ProductCard } from "./product-card";
import { ProductView } from "./product-view";
import type { CartLine, Lang, Product, ShippingRate, StoreCategory } from "./types";
import { translations } from "@/lib/i18n";

type Props = {
  products: Product[];
  categories: StoreCategory[];
  rates: ShippingRate[];
  focusProduct?: Product;
  related?: Product[];
};

const languages: { value: Lang; label: string }[] = [
  { value: "fr", label: "FR" },
  { value: "ar", label: "AR" },
  { value: "en", label: "EN" },
];

export function Storefront({ products, categories, rates, focusProduct, related = [] }: Props) {
  const [lang, setLang] = useState<Lang>("fr");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [size, setSize] = useState("");
  const [maxPrice, setMaxPrice] = useState(20000);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quick, setQuick] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [wishedOnly, setWishedOnly] = useState(false);
  const [color, setColor] = useState("");
  const [inStock, setInStock] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLLabelElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = (key: string) => translations[lang][key] || key;
  const isRtl = lang === "ar";

  useEffect(() => {
    const savedLang = localStorage.getItem("lc-language") as Lang | null;
    const savedCart = localStorage.getItem("lc-cart");
    const savedWishlist = localStorage.getItem("lc-wishlist");
    if (savedLang && ["fr", "en", "ar"].includes(savedLang)) setLang(savedLang);
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch { /* ignore stale storage */ }
    }
    if (savedWishlist) {
      try { setWishlist(JSON.parse(savedWishlist)); } catch { /* ignore stale storage */ }
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    localStorage.setItem("lc-language", lang);
  }, [lang, isRtl]);

  useEffect(() => { localStorage.setItem("lc-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("lc-wishlist", JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { setPage(1); }, [search, category, size, maxPrice, sort, wishedOnly, color, inStock, discountOnly, minPrice]);

  const sessionId = useMemo(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("lc-session-id");
      if (!id) { id = crypto.randomUUID(); localStorage.setItem("lc-session-id", id); }
      return id;
    }
    return "anonymous";
  }, []);

  useEffect(() => {
    if (sessionId !== "anonymous") {
      fetch("/api/wishlist", { headers: { "x-wishlist-session": sessionId } })
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setWishlist(data); })
        .catch(() => {});
    }
  }, [sessionId]);

  const toggleWish = useCallback(async (id: number) => {
    setWishlist((current) => {
      const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      if (sessionId !== "anonymous") {
        fetch("/api/wishlist", {
          method: current.includes(id) ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json", "x-wishlist-session": sessionId },
          body: JSON.stringify({ productId: id }),
        }).catch(() => {});
      }
      return next;
    });
  }, [sessionId]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.trim().length >= 1) {
      searchTimeoutRef.current = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(value.trim())}&limit=6`)
          .then((r) => r.json())
          .then((data) => { setSearchSuggestions(data.products || []); setShowSuggestions(true); })
          .catch(() => {});
      }, 250);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const categoryName = (item: StoreCategory) => lang === "ar" ? item.nameAr : lang === "en" ? item.nameEn : item.nameFr;
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesTerm = !term || [product.nameFr, product.nameEn, product.nameAr].some((name) => name.toLowerCase().includes(term));
      const matchesCategory = category === "all" || product.categorySlug === category;
      const matchesSize = !size || product.sizes.includes(size);
      const matchesPrice = product.price <= maxPrice && product.price >= minPrice;
      const matchesWish = !wishedOnly || wishlist.includes(product.id);
      const matchesColor = !color || product.colors.some((c) => c.name.toLowerCase() === color.toLowerCase());
      const matchesStock = !inStock || product.stock > 0;
      const matchesDiscount = !discountOnly || (product.compareAtPrice !== null && product.compareAtPrice > product.price);
      return matchesTerm && matchesCategory && matchesSize && matchesPrice && matchesWish && matchesColor && matchesStock && matchesDiscount;
    });
    return result.sort((a, b) => {
      if (sort === "newest") return Number(b.isNew) - Number(a.isNew) || b.id - a.id;
      if (sort === "priceLow") return a.price - b.price;
      if (sort === "priceHigh") return b.price - a.price;
      return Number(b.featured) - Number(a.featured) || b.salesCount - a.salesCount;
    });
  }, [products, search, category, size, maxPrice, wishedOnly, wishlist, sort, color, inStock, discountOnly, minPrice]);

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleProducts = filtered.slice((page - 1) * pageSize, page * pageSize);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const addCart = (product: Product, selectedSize: string, color: string, quantity: number) => {
    const key = `${product.id}-${selectedSize}-${color}`;
    setCart((current) => {
      const found = current.find((line) => line.key === key);
      if (found) return current.map((line) => line.key === key ? { ...line, quantity: Math.min(10, line.quantity + quantity) } : line);
      return [...current, { key, product, size: selectedSize, color, quantity }];
    });
    setQuick(null);
    setCartOpen(true);
  };
  const resetFilters = () => { setCategory("all"); setSize(""); setMaxPrice(20000); setMinPrice(0); setSearch(""); setWishedOnly(false); setColor(""); setInStock(false); setDiscountOnly(false); };
  const allColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.colors.forEach((c) => set.add(c.name)));
    return [...set];
  }, [products]);

  const FilterContent = () => (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7568]">{t("category")}</p>
        <div className="space-y-1">
          <button onClick={() => setCategory("all")} className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm transition ${category === "all" ? "bg-[#ece1d6] font-semibold text-[#5a3b2e]" : "text-[#78645a] hover:bg-[#f4eee8]"}`}>{t("all")} {category === "all" && <span className="size-1.5 rounded-full bg-[#6f4e37]" />}</button>
          {categories.map((item) => <button key={item.id} onClick={() => setCategory(item.slug)} className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm transition ${category === item.slug ? "bg-[#ece1d6] font-semibold text-[#5a3b2e]" : "text-[#78645a] hover:bg-[#f4eee8]"}`}>{categoryName(item)} {category === item.slug && <span className="size-1.5 rounded-full bg-[#6f4e37]" />}</button>)}
        </div>
      </div>
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7568]">{t("size")}</p>
        <div className="grid grid-cols-4 gap-2">{["S", "M", "L", "XL"].map((item) => <button key={item} onClick={() => setSize(size === item ? "" : item)} className={`h-10 rounded-xl border text-xs font-semibold transition ${size === item ? "border-[#6f4e37] bg-[#6f4e37] text-white" : "border-[#ded3c8] bg-white text-[#6d574b]"}`}>{item}</button>)}</div>
      </div>
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7568]">{t("color")}</p>
        <div className="flex flex-wrap gap-1.5">{allColors.map((c) => <button key={c} onClick={() => setColor(color === c ? "" : c)} className={`h-8 rounded-full border px-3 text-[10px] font-semibold transition ${color === c ? "border-[#6f4e37] bg-[#6f4e37] text-white" : "border-[#ded3c8] bg-white text-[#6d574b]"}`}>{c}</button>)}</div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7568]">{t("price")}</p><span className="text-xs font-semibold text-[#674837]">≤ {new Intl.NumberFormat("fr-DZ").format(maxPrice)} DA</span></div>
        <input aria-label={t("price")} type="range" min="7000" max="20000" step="500" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="accent-[#6f4e37]" />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-[#78645a]"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-[#6f4e37]" /> {t("stock")}</label>
        <label className="flex items-center gap-2 text-xs text-[#78645a]"><input type="checkbox" checked={discountOnly} onChange={(e) => setDiscountOnly(e.target.checked)} className="accent-[#6f4e37]" /> {t("sale")}</label>
      </div>
      <button onClick={resetFilters} className="h-11 w-full rounded-xl border border-[#d9ccc0] text-xs font-bold uppercase tracking-[.1em] text-[#735441] transition hover:bg-[#f3ebe4]">{t("reset")}</button>
    </div>
  );

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen overflow-x-clip bg-[#faf8f5] text-[#3e2723]">
      <div className="flex h-8 items-center justify-center bg-[#6f4e37] px-4 text-center text-[9px] font-bold uppercase tracking-[.13em] text-white sm:text-[10px]">
        <Truck size={13} className="me-2" /> {t("freeFrom")}
      </div>
      <header className="sticky top-0 z-50 border-b border-[#e9dfd6]/90 bg-[#fffdfa]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[66px] max-w-[1500px] items-center justify-between px-3 sm:h-[76px] sm:px-6 lg:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-7">
            <button onClick={() => setMenuOpen(true)} aria-label={t("menu")} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-[#f1e8e0] lg:hidden"><Menu size={21} /></button>
            <nav className="hidden items-center gap-7 lg:flex">
              <Link href="/" className="text-xs font-bold uppercase tracking-[.12em] text-[#55392e]">{t("shop")}</Link>
              <button onClick={() => { setCategory("all"); setSort("newest"); window.location.href = focusProduct ? "/?sort=newest" : "#products"; }} className="text-xs font-medium uppercase tracking-[.12em] text-[#7c675d] hover:text-[#54382d]">{t("newCollection")}</button>
              <a href="#delivery" className="text-xs font-medium uppercase tracking-[.12em] text-[#7c675d] hover:text-[#54382d]">{t("delivery")}</a>
            </nav>
          </div>
          <Link href="/" aria-label="La Coquette" className="absolute start-1/2 -translate-x-1/2 text-center leading-none">
            <span className="block whitespace-nowrap font-serif text-[27px] font-semibold tracking-[-.025em] text-[#4a3027] sm:text-[32px]">La Coquette</span>
            <span className="mt-0.5 hidden text-[7px] font-bold uppercase tracking-[.38em] text-[#9a7962] sm:block">Alger · Maison de mode</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5 sm:gap-1.5">
            <label className="relative hidden xl:block" ref={searchRef}>
              <Search size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#876f62]" />
              <input value={search} onChange={(event) => handleSearchChange(event.target.value)} onFocus={() => searchSuggestions.length && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder={t("search")} className="h-11 w-[220px] rounded-full border border-[#e5dad0] bg-[#faf7f3] pe-4 ps-10 text-xs outline-none transition focus:border-[#96745d] focus:bg-white" />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-[340px] overflow-hidden rounded-2xl border border-[#e9dfd6] bg-white shadow-xl">
                  {searchSuggestions.map((p) => (
                    <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#faf7f4]">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[#eee5dd]"><Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" /></div>
                      <div className="min-w-0"><p className="truncate text-xs font-semibold">{lang === "ar" ? p.nameAr : lang === "en" ? p.nameEn : p.nameFr}</p><p className="text-[10px] text-[#9a887b]">{new Intl.NumberFormat("fr-DZ").format(p.price)} DA</p></div>
                    </Link>
                  ))}
                </div>
              )}
            </label>
            <div className="relative hidden sm:block">
              <select aria-label="Language" value={lang} onChange={(event) => setLang(event.target.value as Lang)} className="h-11 appearance-none rounded-full border border-transparent bg-transparent py-0 pe-7 ps-3 text-[11px] font-bold outline-none hover:bg-[#f2ebe4]">
                {languages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select><ChevronDown size={11} className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button onClick={() => { setWishedOnly(!wishedOnly); if (focusProduct) window.location.href = "/"; }} aria-label={t("wishlist")} className={`relative hidden size-11 place-items-center rounded-full transition hover:bg-[#f2ebe4] sm:grid ${wishedOnly ? "bg-[#eee3d8]" : ""}`}><Heart size={20} fill={wishedOnly ? "currentColor" : "none"} /><span className="sr-only">{wishlist.length}</span></button>
            <button onClick={() => setCartOpen(true)} aria-label={t("cart")} className="relative grid size-11 shrink-0 place-items-center rounded-full transition hover:bg-[#f2ebe4]"><ShoppingBag size={20} />{cartCount > 0 && <span className="absolute end-0.5 top-0.5 grid min-w-4.5 place-items-center rounded-full bg-[#6f4e37] px-1 text-[9px] font-bold leading-[18px] text-white">{cartCount}</span>}</button>
          </div>
        </div>
        {!focusProduct && <div className="border-t border-[#eee6df] px-3 py-2.5 xl:hidden"><label className="relative mx-auto block max-w-2xl"><Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#8c7569]" /><input id="mobile-search" value={search} onChange={(event) => handleSearchChange(event.target.value)} placeholder={t("search")} className="h-11 w-full rounded-full bg-[#f3ede7] pe-4 ps-11 text-[16px] outline-none placeholder:text-[#a18e83] focus:ring-2 focus:ring-[#92715b]/25" /></label>{showSuggestions && searchSuggestions.length > 0 && <div className="mx-auto mt-2 max-w-2xl overflow-hidden rounded-2xl border border-[#e9dfd6] bg-white shadow-xl">{searchSuggestions.map((p) => <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#faf7f4]"><div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[#eee5dd]"><Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold">{lang === "ar" ? p.nameAr : lang === "en" ? p.nameEn : p.nameFr}</p><p className="text-[10px] text-[#9a887b]">{new Intl.NumberFormat("fr-DZ").format(p.price)} DA</p></div></Link>)}</div>}</div>}
      </header>

      <main>
        {focusProduct ? (
          <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-5 sm:px-7 sm:pt-8 lg:px-10">
            <nav className="mb-6 flex items-center gap-2 text-[11px] text-[#917d72]"><Link href="/" className="hover:text-[#5e4133]">{t("shop")}</Link><ChevronRight size={12} className={isRtl ? "rotate-180" : ""} /><span className="truncate text-[#60483c]">{lang === "ar" ? focusProduct.nameAr : lang === "en" ? focusProduct.nameEn : focusProduct.nameFr}</span></nav>
            <ProductView product={focusProduct} lang={lang} t={t} onAdd={addCart} />
            {!!related.length && <section className="mt-20 sm:mt-28"><div className="mb-7 flex items-end justify-between"><h2 className="font-serif text-3xl font-semibold sm:text-4xl">{t("related")}</h2><Link href="/" className="text-xs font-bold uppercase tracking-[.12em] text-[#795945]">{t("all")}</Link></div><div className="grid grid-cols-2 gap-x-2.5 gap-y-7 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{related.map((product) => <ProductCard key={product.id} product={product} lang={lang} t={t} wished={wishlist.includes(product.id)} onWish={toggleWish} onQuick={setQuick} />)}</div></section>}
          </div>
        ) : (
          <div id="products" className="mx-auto max-w-[1500px] px-3 pb-24 pt-5 sm:px-6 sm:pt-8 lg:px-10">
            <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
              <div><div className="mb-1.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7d69]"><Sparkles size={12} /> La Coquette · Alger</div><h1 className="font-serif text-[2rem] font-semibold leading-none text-[#432c24] sm:text-[2.7rem]">{wishedOnly ? t("wishlist") : t("collection")}</h1><p className="mt-2 hidden text-sm text-[#8b776c] sm:block">{t("curated")}</p></div>
              <span className="shrink-0 text-[11px] text-[#8f7b70]">{filtered.length} {t("pieces")}</span>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-2 sm:mb-7">
              <button onClick={() => setFilterOpen(true)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#ded3c9] bg-white px-4 text-xs font-semibold sm:hidden"><Filter size={16} /> {t("filters")}</button>
              <button onClick={() => setFiltersVisible(!filtersVisible)} className="hidden h-11 items-center gap-2 rounded-full border border-[#ded3c9] bg-white px-5 text-xs font-semibold sm:flex"><SlidersHorizontal size={15} /> {t("filters")}</button>
              <div className="order-last flex w-full gap-2 overflow-x-auto pb-1 sm:order-none sm:w-auto sm:flex-1 sm:ps-2">
                <button onClick={() => setCategory("all")} className={`h-10 shrink-0 rounded-full px-4 text-xs font-semibold transition ${category === "all" ? "bg-[#6f4e37] text-white" : "bg-[#efe7df] text-[#72594b]"}`}>{t("all")}</button>
                {categories.map((item) => <button key={item.id} onClick={() => setCategory(item.slug)} className={`h-10 shrink-0 rounded-full px-4 text-xs font-semibold transition ${category === item.slug ? "bg-[#6f4e37] text-white" : "bg-[#efe7df] text-[#72594b]"}`}>{categoryName(item)}</button>)}
              </div>
              <label className="relative min-w-0 flex-1 sm:max-w-[190px]"><span className="sr-only">{t("sort")}</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 w-full appearance-none rounded-full border border-[#ded3c9] bg-white pe-8 ps-4 text-xs font-semibold outline-none"><option value="featured">{t("featured")}</option><option value="newest">{t("newest")}</option><option value="priceLow">{t("priceLow")}</option><option value="priceHigh">{t("priceHigh")}</option></select><ChevronDown size={13} className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2" /></label>
            </div>

            <div className={`grid min-w-0 gap-6 ${filtersVisible ? "sm:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]" : "grid-cols-1"}`}>
              {filtersVisible && <aside className="hidden self-start rounded-[22px] border border-[#e6dcd3] bg-white p-4 sm:sticky sm:top-[105px] sm:block lg:p-5"><FilterContent /></aside>}
              <div className="min-w-0">
                {visibleProducts.length ? <motion.div layout className={`grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-4 sm:gap-y-9 ${filtersVisible ? "md:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-3 lg:grid-cols-4"}`}>{visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} lang={lang} t={t} wished={wishlist.includes(product.id)} onWish={toggleWish} onQuick={setQuick} priority={index < 4 && page === 1} />)}</motion.div> : <div className="grid min-h-[40vh] place-items-center rounded-3xl bg-[#f3ede7] px-6 text-center"><div><Search className="mx-auto text-[#9c8474]" strokeWidth={1.3} size={36} /><p className="mt-4 font-serif text-2xl text-[#5c4235]">{t("noProducts")}</p><button onClick={resetFilters} className="mt-5 text-xs font-bold uppercase tracking-[.12em] text-[#79533e] underline underline-offset-4">{t("reset")}</button></div></div>}
                {pageCount > 1 && <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination"><button disabled={page === 1} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label={t("previous")} className="grid size-11 place-items-center rounded-full border border-[#ded2c7] bg-white disabled:opacity-35"><ChevronLeft size={17} className={isRtl ? "rotate-180" : ""} /></button>{Array.from({ length: pageCount }, (_, index) => <button key={index} onClick={() => setPage(index + 1)} className={`grid size-11 place-items-center rounded-full text-xs font-bold ${page === index + 1 ? "bg-[#6f4e37] text-white" : "bg-white text-[#674c3d]"}`}>{index + 1}</button>)}<button disabled={page === pageCount} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label={t("next")} className="grid size-11 place-items-center rounded-full border border-[#ded2c7] bg-white disabled:opacity-35"><ChevronRight size={17} className={isRtl ? "rotate-180" : ""} /></button></nav>}
              </div>
            </div>
          </div>
        )}
      </main>

      <section id="delivery" className="border-y border-[#e8ddd3] bg-[#f1e9e1]">
        <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-4 px-6 py-8 sm:grid-cols-3 sm:py-10">
          {[[Truck, t("delivery58")], [ShoppingBag, t("cash")], [Sparkles, t("support")]].map(([Icon, label], index) => { const FeatureIcon = Icon as typeof Truck; return <div key={index} className="flex items-center justify-center gap-3 text-center text-xs font-semibold uppercase tracking-[.08em] text-[#654b3d]"><FeatureIcon size={18} strokeWidth={1.5} /> {String(label)}</div>; })}
        </div>
      </section>
      <footer className="bg-[#fffdfa] px-5 pb-28 pt-12 sm:pb-10 sm:pt-16">
        <div className="mx-auto grid max-w-[1300px] gap-10 sm:grid-cols-3 sm:items-start">
          <div><p className="font-serif text-3xl font-semibold">La Coquette</p><p className="mt-3 max-w-xs text-xs leading-6 text-[#8b776c]">Maison algérienne de mode féminine. Des silhouettes contemporaines, pensées avec grâce à Alger.</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7568]">{t("ourUniverse")}</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#6d574c]"><Link href="/">{t("shop")}</Link><a href="#delivery">{t("delivery")}</a><Link href="/admin/login">Administration</Link></div></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7568]">{t("follow")}</p><div className="mt-4 flex gap-2"><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-11 place-items-center rounded-full border border-[#ded2c8] hover:bg-[#efe6de]"><Camera size={17} /></a><a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" className="grid size-11 place-items-center rounded-full border border-[#ded2c8] text-xs font-black hover:bg-[#efe6de]">TK</a></div></div>
        </div><div className="mx-auto mt-12 max-w-[1300px] border-t border-[#e9dfd6] pt-5 text-[10px] text-[#99867b]">© {new Date().getFullYear()} La Coquette. {t("rights")}</div>
      </footer>

      <a href="https://wa.me/213550000000?text=Bonjour%20La%20Coquette" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="fixed bottom-[84px] end-4 z-40 grid size-13 place-items-center rounded-full bg-[#617f5a] text-sm font-extrabold text-white shadow-[0_10px_28px_rgba(54,83,49,.3)] transition hover:-translate-y-1 sm:bottom-5 sm:end-5">WA</a>
      <nav className="fixed inset-x-3 bottom-3 z-40 grid h-16 grid-cols-4 rounded-[22px] border border-white/70 bg-white/92 px-2 shadow-[0_12px_40px_rgba(76,51,38,.18)] backdrop-blur-xl sm:hidden">
        <Link href="/" className="flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold text-[#62483a]"><Sparkles size={19} />{t("shop")}</Link>
        <button onClick={() => { document.getElementById("mobile-search")?.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold text-[#62483a]"><Search size={19} />{t("searchShort")}</button>
        <button onClick={() => { setWishedOnly(!wishedOnly); if (focusProduct) window.location.href = "/"; }} className="relative flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold text-[#62483a]"><Heart size={19} fill={wishedOnly ? "currentColor" : "none"} />{t("wishlist")}{wishlist.length > 0 && <span className="absolute end-[22%] top-2.5 size-2 rounded-full bg-[#8c5f48]" />}</button>
        <button onClick={() => setCartOpen(true)} className="relative flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold text-[#62483a]"><ShoppingBag size={19} />{t("cart")}{cartCount > 0 && <span className="absolute end-[22%] top-1.5 grid min-w-4 place-items-center rounded-full bg-[#6f4e37] px-1 text-[8px] leading-4 text-white">{cartCount}</span>}</button>
      </nav>

      <AnimatePresence>
        {menuOpen && <><motion.button aria-label={t("close")} className="fixed inset-0 z-[60] bg-[#35231d]/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.aside initial={{ x: isRtl ? "100%" : "-100%" }} animate={{ x: 0 }} exit={{ x: isRtl ? "100%" : "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 31 }} className="fixed inset-y-0 start-0 z-[70] w-[86%] max-w-sm bg-[#fffdfa] p-6 shadow-2xl"><div className="flex items-center justify-between"><span className="font-serif text-3xl font-semibold">La Coquette</span><button onClick={() => setMenuOpen(false)} className="grid size-11 place-items-center rounded-full bg-[#f2ebe4]"><X size={19} /></button></div><nav className="mt-12 flex flex-col gap-2"><Link href="/" onClick={() => setMenuOpen(false)} className="border-b border-[#ece2d9] py-4 font-serif text-3xl">{t("shop")}</Link><button onClick={() => { setSort("newest"); setMenuOpen(false); }} className="border-b border-[#ece2d9] py-4 text-start font-serif text-3xl">{t("newCollection")}</button><a href="#delivery" onClick={() => setMenuOpen(false)} className="border-b border-[#ece2d9] py-4 font-serif text-3xl">{t("delivery")}</a></nav><div className="mt-10 flex gap-2">{languages.map((item) => <button key={item.value} onClick={() => setLang(item.value)} className={`grid size-12 place-items-center rounded-full text-xs font-bold ${lang === item.value ? "bg-[#6f4e37] text-white" : "bg-[#eee6df]"}`}>{item.label}</button>)}</div></motion.aside></>}
        {filterOpen && <><motion.button className="fixed inset-0 z-[60] bg-[#35231d]/30 backdrop-blur-sm" onClick={() => setFilterOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-label={t("close")} /><motion.aside initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 31 }} className="fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] overflow-y-auto rounded-t-[28px] bg-[#fffdfa] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-4"><div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#d8c9bd]" /><div className="mb-6 flex items-center justify-between"><h2 className="font-serif text-3xl font-semibold">{t("filters")}</h2><button onClick={() => setFilterOpen(false)} className="grid size-11 place-items-center rounded-full bg-[#f1e9e2]"><X size={18} /></button></div><FilterContent /><button onClick={() => setFilterOpen(false)} className="mt-4 h-14 w-full rounded-2xl bg-[#6f4e37] text-sm font-bold text-white">{t("productsLabel")} · {filtered.length}</button></motion.aside></>}
        {quick && <><motion.button aria-label={t("close")} onClick={() => setQuick(null)} className="fixed inset-0 z-[80] bg-[#33211b]/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.div role="dialog" aria-modal="true" initial={{ opacity: 0, y: 30, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .98 }} className="fixed inset-x-0 bottom-0 z-[90] max-h-[92vh] overflow-y-auto rounded-t-[28px] bg-[#fffdfa] p-4 pb-8 shadow-2xl sm:inset-auto sm:start-1/2 sm:top-1/2 sm:w-[min(930px,92vw)] sm:max-h-[88vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7"><button onClick={() => setQuick(null)} className="sticky top-0 z-20 ms-auto grid size-11 place-items-center rounded-full bg-white text-[#52382d] shadow-md"><X size={18} /></button><div className="-mt-8 pt-1"><ProductView product={quick} lang={lang} t={t} compact onAdd={addCart} onClose={() => setQuick(null)} /></div></motion.div></>}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} rates={rates} lang={lang} t={t} onQuantity={(key, quantity) => setCart((current) => current.map((line) => line.key === key ? { ...line, quantity } : line))} onRemove={(key) => setCart((current) => current.filter((line) => line.key !== key))} onComplete={() => setCart([])} />
    </div>
  );
}
