"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, ChevronRight, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { localizedProduct, money } from "@/lib/i18n";
import type { CartLine, Lang, ShippingRate, StoreCopy } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  rates: ShippingRate[];
  lang: Lang;
  t: StoreCopy;
  onQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onComplete: () => void;
};

type Details = { fullName: string; phone: string; wilayaCode: string; commune: string; address: string; note: string; deliveryType: "home" | "office" };
const emptyDetails: Details = { fullName: "", phone: "", wilayaCode: "", commune: "", address: "", note: "", deliveryType: "home" };

export function CartDrawer({ open, onClose, cart, rates, lang, t, onQuantity, onRemove, onComplete }: Props) {
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const subtotal = useMemo(() => cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0), [cart]);
  const selectedRate = rates.find((rate) => rate.code === Number(details.wilayaCode));
  const shipping = selectedRate ? (selectedRate.code === 16 && subtotal >= 25000 ? 0 : details.deliveryType === "office" ? selectedRate.deskPrice : selectedRate.homePrice) : 0;
  const total = subtotal + shipping;

  const close = () => {
    onClose();
    window.setTimeout(() => {
      if (step === "success") {
        setStep("cart");
        setDetails(emptyDetails);
        setOrderNumber("");
      }
    }, 350);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!details.fullName.trim() || !details.phone.trim() || !details.wilayaCode || !details.commune.trim() || !details.address.trim()) {
      setError(t("required"));
      return;
    }
    const phone = details.phone.replace(/[\s.-]/g, "");
    if (!/^(?:0|\+213|00213)[5-7]\d{8}$/.test(phone)) {
      setError(t("phoneError"));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: details, items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity, size: line.size, color: line.color })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t("required"));
      setOrderNumber(result.orderNumber);
      setStep("success");
      onComplete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("required"));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-13 w-full rounded-2xl border border-[#dfd4c9] bg-white px-4 text-[16px] text-[#3e2723] outline-none transition placeholder:text-[#ad9c91] focus:border-[#795a46] focus:ring-4 focus:ring-[#795a46]/10 sm:text-sm";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button aria-label={t("close")} onClick={close} className="fixed inset-0 z-[70] bg-[#38241e]/35 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t("yourCart")}
            dir={lang === "ar" ? "rtl" : "ltr"}
            initial={{ x: lang === "ar" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: lang === "ar" ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className={`fixed inset-y-0 z-[80] flex w-full max-w-[520px] flex-col bg-[#faf8f5] shadow-2xl ${lang === "ar" ? "start-0" : "end-0"}`}
          >
            <header className="flex h-[74px] shrink-0 items-center justify-between border-b border-[#eadfd5] bg-white/80 px-5 backdrop-blur-xl sm:px-7">
              <div className="flex items-center gap-3">
                {step === "checkout" && <button onClick={() => setStep("cart")} aria-label={t("previous")} className="grid size-11 place-items-center rounded-full hover:bg-[#f4eee7]"><ArrowLeft size={19} className={lang === "ar" ? "rotate-180" : ""} /></button>}
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#3e2723]">{step === "checkout" ? t("checkout") : step === "success" ? t("orderSuccess") : t("yourCart")}</h2>
                  {step === "cart" && <p className="text-[11px] text-[#8b786d]">{cart.reduce((sum, line) => sum + line.quantity, 0)} {t("pieces")}</p>}
                </div>
              </div>
              <button onClick={close} aria-label={t("close")} className="grid size-11 place-items-center rounded-full border border-[#eadfd5] bg-white text-[#5b4033] transition hover:bg-[#f5efe6]"><X size={19} /></button>
            </header>

            {step === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                  {!cart.length ? (
                    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                      <div className="grid size-20 place-items-center rounded-full bg-[#efe5db] text-[#765441]"><ShoppingBag size={29} strokeWidth={1.4} /></div>
                      <p className="mt-5 max-w-[260px] font-serif text-2xl text-[#493128]">{t("emptyCart")}</p>
                      <button onClick={close} className="mt-7 h-12 rounded-full border border-[#80604d] px-7 text-xs font-bold uppercase tracking-[.12em] text-[#684a3a]">{t("continueShopping")}</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((line) => {
                        const copy = localizedProduct(line.product, lang);
                        return (
                          <motion.div layout key={line.key} className="grid grid-cols-[88px_1fr] gap-4 rounded-[22px] bg-white p-3 shadow-[0_8px_30px_rgba(76,51,38,.06)]">
                            <div className="relative aspect-[3/4] overflow-hidden rounded-[15px] bg-[#eee5db]"><Image src={line.product.images[0]} alt={copy.name} fill sizes="100px" className="object-cover" /></div>
                            <div className="min-w-0 py-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-[#432d24]">{copy.name}</h3><p className="mt-1 text-[11px] text-[#8b796e]">{line.size} · {line.color}</p></div>
                                <button onClick={() => onRemove(line.key)} aria-label="Supprimer" className="grid size-9 shrink-0 place-items-center rounded-full text-[#9d877a] hover:bg-[#f6eee7] hover:text-[#7b4938]"><Trash2 size={15} /></button>
                              </div>
                              <div className="mt-4 flex items-center justify-between gap-2">
                                <div className="flex items-center rounded-xl border border-[#e2d8cf] p-0.5">
                                  <button onClick={() => onQuantity(line.key, Math.max(1, line.quantity - 1))} className="grid size-8 place-items-center"><Minus size={13} /></button>
                                  <span className="w-6 text-center text-xs font-bold">{line.quantity}</span>
                                  <button onClick={() => onQuantity(line.key, Math.min(10, line.quantity + 1))} className="grid size-8 place-items-center"><Plus size={13} /></button>
                                </div>
                                <span className="text-sm font-bold text-[#704e3b]">{money(line.product.price * line.quantity, lang)}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {!!cart.length && (
                  <footer className="shrink-0 border-t border-[#e9ded4] bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5 sm:px-7">
                    <div className="flex items-center justify-between text-sm text-[#7b685e]"><span>{t("subtotal")}</span><strong className="text-lg text-[#442e25]">{money(subtotal, lang)}</strong></div>
                    <p className="mt-1 text-[11px] text-[#9b887c]">{t("calculated")}</p>
                    <button onClick={() => setStep("checkout")} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#65442f] to-[#846047] text-sm font-bold text-white shadow-[0_14px_28px_rgba(91,59,42,.2)] transition hover:-translate-y-0.5">
                      {t("checkout")} <ChevronRight size={18} className={lang === "ar" ? "rotate-180" : ""} />
                    </button>
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#8f7a6d]"><ShieldCheck size={13} /> {t("secureOrder")}</p>
                  </footer>
                )}
              </>
            )}

            {step === "checkout" && (
              <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-[#624536]">{t("customerDetails")}</h3>
                  <div className="space-y-3">
                    <input className={inputClass} placeholder={`${t("fullName")} *`} autoComplete="name" value={details.fullName} onChange={(e) => setDetails({ ...details, fullName: e.target.value })} />
                    <input className={inputClass} placeholder={`${t("phone")} *`} inputMode="tel" autoComplete="tel" dir="ltr" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
                    <select aria-label={t("wilaya")} className={inputClass} value={details.wilayaCode} onChange={(e) => setDetails({ ...details, wilayaCode: e.target.value })}>
                      <option value="">{t("selectWilaya")} *</option>
                      {rates.map((rate) => <option key={rate.code} value={rate.code}>{String(rate.code).padStart(2, "0")} — {rate.name} · {money(rate.homePrice, lang)}</option>)}
                    </select>
                    <input className={inputClass} placeholder={`${t("commune")} *`} autoComplete="address-level2" value={details.commune} onChange={(e) => setDetails({ ...details, commune: e.target.value })} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setDetails({ ...details, deliveryType: "home" })} className={`flex-1 h-13 rounded-2xl border text-sm font-semibold transition ${details.deliveryType === "home" ? "border-[#6f4e37] bg-[#6f4e37] text-white" : "border-[#dfd4c9] bg-white text-[#795a46]"}`}>🏠 {t("homeDelivery")}</button>
                      <button type="button" onClick={() => setDetails({ ...details, deliveryType: "office" })} className={`flex-1 h-13 rounded-2xl border text-sm font-semibold transition ${details.deliveryType === "office" ? "border-[#6f4e37] bg-[#6f4e37] text-white" : "border-[#dfd4c9] bg-white text-[#795a46]"}`}>🏢 {t("officeDelivery")}</button>
                    </div>
                    {selectedRate && selectedRate.estimatedDays && <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#9b887c]">📦 {t("estimatedDelivery")}: {selectedRate.estimatedDays} {t("days")}</p>}
                    <textarea className="min-h-24 w-full resize-none rounded-2xl border border-[#dfd4c9] bg-white px-4 py-3 text-[16px] outline-none transition placeholder:text-[#ad9c91] focus:border-[#795a46] focus:ring-4 focus:ring-[#795a46]/10 sm:text-sm" placeholder={`${t("address")} *`} autoComplete="street-address" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} />
                    <textarea className="min-h-20 w-full resize-none rounded-2xl border border-[#dfd4c9] bg-white px-4 py-3 text-[16px] outline-none transition placeholder:text-[#ad9c91] focus:border-[#795a46] focus:ring-4 focus:ring-[#795a46]/10 sm:text-sm" placeholder={t("note")} value={details.note} onChange={(e) => setDetails({ ...details, note: e.target.value })} />
                  </div>

                  <div className="mt-6 rounded-[20px] bg-[#f1e9e0] p-4">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-[.12em] text-[#624536]">{t("orderSummary")}</h3>
                    <div className="space-y-2 text-sm text-[#756157]"><div className="flex justify-between"><span>{t("subtotal")}</span><span>{money(subtotal, lang)}</span></div><div className="flex justify-between"><span>{t("shipping")}</span><span>{selectedRate ? (shipping === 0 ? "0 DA" : money(shipping, lang)) : "—"}</span></div><div className="mt-3 flex justify-between border-t border-[#dbcec1] pt-3 font-bold text-[#3f2a22]"><span>{t("total")}</span><span className="text-lg">{money(total, lang)}</span></div></div>
                  </div>
                  {error && <motion.p role="alert" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl bg-[#fff0eb] px-4 py-3 text-xs font-medium text-[#9c4f39]">{error}</motion.p>}
                </div>
                <footer className="shrink-0 border-t border-[#e9ded4] bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 sm:px-7">
                  <button disabled={loading} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#65442f] to-[#846047] text-sm font-bold text-white shadow-[0_14px_28px_rgba(91,59,42,.2)] disabled:opacity-60">
                    {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> {t("processing")}</> : <><PackageCheck size={18} /> {t("placeOrder")} · {money(total, lang)}</>}
                  </button>
                </footer>
              </form>
            )}

            {step === "success" && (
              <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
                <motion.div initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid size-24 place-items-center rounded-full bg-[#e7eee3] text-[#57704d]"><Check size={40} strokeWidth={1.6} /></motion.div>
                <h3 className="mt-7 font-serif text-4xl font-semibold text-[#402b23]">{t("orderSuccess")}</h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-[#79675d]">{t("orderReceived")}</p>
                <div className="mt-7 rounded-2xl bg-[#efe6dd] px-7 py-4"><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#927c6e]">{t("orderNumber")}</span><strong className="mt-1 block text-lg tracking-[.08em] text-[#5b3d2f]">{orderNumber}</strong></div>
                <button onClick={close} className="mt-8 h-13 rounded-2xl bg-[#6f4e37] px-8 text-sm font-bold text-white">{t("backShop")}</button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
