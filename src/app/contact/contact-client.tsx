"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Mail, MapPin, Menu, MessageCircle, Phone, Search, ShoppingBag, Sparkles, Truck, X } from "lucide-react";
import { FacebookIcon as Facebook, InstagramIcon as Instagram } from "@/components/store/social-icons";
import { AnimatePresence, motion } from "motion/react";
import type { SiteSettingsMap } from "@/lib/site-settings";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

const languages: { value: Lang; label: string }[] = [
  { value: "fr", label: "FR" },
  { value: "ar", label: "AR" },
  { value: "en", label: "EN" },
];

function toWhatsAppLink(number: string) {
  const digits = String(number || "").replace(/\D/g, "");
  return `https://wa.me/213${digits.replace(/^0/, "")}?text=${encodeURIComponent("Bonjour La Coquette")}`;
}

export function ContactPageClient() {
  const [lang, setLang] = useState<Lang>("fr");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettingsMap>({
    whatsappNumber: "0541442571",
    phoneNumber: "0541442571",
    instagramLink: "https://www.instagram.com/lacoquette.brand",
    facebookLink: "https://www.facebook.com/share/1BRYR8uzsZ/?mibextid=wwXIfr",
    emailAddress: "web.automation.310@gmail.com",
    googleMapsLink: "https://www.google.com/maps/search/?api=1&query=La+Coquette+Alger",
    businessHours: "Lun - Sam: 10:00 - 20:00",
    storeAddress: "Alger, Algérie",
  });
  const t = (key: string) => translations[lang][key] || key;
  const isRtl = lang === "ar";

  useEffect(() => {
    const savedLang = localStorage.getItem("lc-language") as Lang | null;
    if (savedLang && ["fr", "en", "ar"].includes(savedLang)) setLang(savedLang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    localStorage.setItem("lc-language", lang);
  }, [lang, isRtl]);

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((data) => {
      if (data && typeof data === "object") setSettings((prev) => ({ ...prev, ...data }));
    }).catch(() => {});
  }, []);

  const mapQuery = encodeURIComponent(settings.storeAddress || "Alger, Algérie");
  const embedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const openMapsUrl = settings.googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen overflow-x-clip bg-[#faf8f5] text-[#3e2723]">
      {/* Top Bar */}
      <div className="flex h-8 items-center justify-center bg-[#6f4e37] px-4 text-center text-[9px] font-bold uppercase tracking-[.13em] text-white sm:text-[10px]">
        <Truck size={13} className="me-2" /> {t("freeFrom")}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#e9dfd6]/90 bg-[#fffdfa]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[66px] max-w-[1500px] items-center justify-between px-3 sm:h-[76px] sm:px-6 lg:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-7">
            <button onClick={() => setMenuOpen(true)} aria-label={t("menu")} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-[#f1e8e0] lg:hidden"><Menu size={21} /></button>
            <nav className="hidden items-center gap-7 lg:flex">
              <Link href="/" className="text-xs font-bold uppercase tracking-[.12em] text-[#55392e]">{t("shop")}</Link>
              <Link href="/#delivery" className="text-xs font-medium uppercase tracking-[.12em] text-[#7c675d] hover:text-[#54382d]">{t("delivery")}</Link>
              <Link href="/contact" className="text-xs font-bold uppercase tracking-[.12em] text-[#6f4e37]">Contact</Link>
            </nav>
          </div>
          <Link href="/" aria-label="La Coquette" className="absolute start-1/2 -translate-x-1/2 text-center leading-none">
            <span className="block whitespace-nowrap font-serif text-[27px] font-semibold tracking-[-.025em] text-[#4a3027] sm:text-[32px]">La Coquette</span>
            <span className="mt-0.5 hidden text-[7px] font-bold uppercase tracking-[.38em] text-[#9a7962] sm:block">Alger · Maison de mode</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5 sm:gap-1.5">
            <div className="relative hidden sm:block">
              <select aria-label="Language" value={lang} onChange={(event) => setLang(event.target.value as Lang)} className="h-11 appearance-none rounded-full border border-transparent bg-transparent py-0 pe-7 ps-3 text-[11px] font-bold outline-none hover:bg-[#f2ebe4]">
                {languages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select><ChevronDown size={11} className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <Link href="/" aria-label={t("cart")} className="grid size-11 place-items-center rounded-full transition hover:bg-[#f2ebe4]"><ShoppingBag size={20} /></Link>
          </div>
        </div>
      </header>

      {/* Contact Content */}
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-7 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-1 text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7d69]">La Coquette · Alger</div>
          <h1 className="font-serif text-[2.2rem] font-semibold leading-tight text-[#432c24] sm:text-[3rem]">Contactez-nous</h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-[#8b776c]">Nous sommes à votre écoute. N&apos;hésitez pas à nous contacter pour toute question, commande ou conseil personnel.</p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Left Column: Contact Info */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-5">
            {/* Phone */}
            <a href={`tel:${settings.phoneNumber.replace(/\D/g, "").startsWith("0") ? "+213" + settings.phoneNumber.replace(/\D/g, "").slice(1) : settings.phoneNumber}`} className="group flex items-center gap-4 rounded-[20px] border border-[#e5dbd3] bg-white p-5 transition hover:border-[#c9b5a5] hover:shadow-md">
              <div className="grid size-12 place-items-center rounded-full bg-[#f1e9e0] text-[#6f4e37] group-hover:bg-[#6f4e37] group-hover:text-white transition"><Phone size={20} /></div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9a887b]">Téléphone</p>
                <p className="mt-1 text-sm font-semibold text-[#4a3027]">{settings.phoneNumber}</p>
              </div>
            </a>

            {/* WhatsApp */}
            <a href={toWhatsAppLink(settings.whatsappNumber)} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-[20px] border border-[#e5dbd3] bg-white p-5 transition hover:border-[#c9b5a5] hover:shadow-md">
              <div className="grid size-12 place-items-center rounded-full bg-[#e4eee1] text-[#52704a] group-hover:bg-[#52704a] group-hover:text-white transition"><MessageCircle size={20} /></div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9a887b]">WhatsApp</p>
                <p className="mt-1 text-sm font-semibold text-[#4a3027]">{settings.whatsappNumber}</p>
              </div>
            </a>

            {/* Email */}
            <a href={`mailto:${settings.emailAddress}`} className="group flex items-center gap-4 rounded-[20px] border border-[#e5dbd3] bg-white p-5 transition hover:border-[#c9b5a5] hover:shadow-md">
              <div className="grid size-12 place-items-center rounded-full bg-[#eee5dd] text-[#7d5d49] group-hover:bg-[#7d5d49] group-hover:text-white transition"><Mail size={20} /></div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9a887b]">Email</p>
                <p className="mt-1 text-sm font-semibold text-[#4a3027]">{settings.emailAddress}</p>
              </div>
            </a>

            {/* Instagram */}
            <a href={settings.instagramLink} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-[20px] border border-[#e5dbd3] bg-white p-5 transition hover:border-[#c9b5a5] hover:shadow-md">
              <div className="grid size-12 place-items-center rounded-full bg-[#f5ead2] text-[#8b662a] group-hover:bg-[#8b662a] group-hover:text-white transition"><Instagram size={20} /></div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9a887b]">Instagram</p>
                <p className="mt-1 text-sm font-semibold text-[#4a3027]">@lacoquette.brand</p>
              </div>
            </a>

            {/* Facebook */}
            <a href={settings.facebookLink} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-[20px] border border-[#e5dbd3] bg-white p-5 transition hover:border-[#c9b5a5] hover:shadow-md">
              <div className="grid size-12 place-items-center rounded-full bg-[#e5e9f2] text-[#4e6083] group-hover:bg-[#4e6083] group-hover:text-white transition"><Facebook size={20} /></div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9a887b]">Facebook</p>
                <p className="mt-1 text-sm font-semibold text-[#4a3027]">La Coquette</p>
              </div>
            </a>

            {/* Business Hours */}
            <div className="rounded-[20px] border border-[#e5dbd3] bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9a887b]">Horaires d&apos;ouverture</p>
              <p className="mt-2 text-sm font-semibold text-[#4a3027]">{settings.businessHours}</p>
            </div>
          </motion.div>

          {/* Right Column: Map & Store Info */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-6">
            {/* Our Store */}
            <div className="rounded-[24px] border border-[#e5dbd3] bg-white p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold text-[#432c24] sm:text-3xl">Notre Magasin</h2>
              <div className="mt-4 flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-[#6f4e37]" />
                <div>
                  <p className="text-sm font-semibold text-[#4a3027]">{settings.storeAddress}</p>
                  <p className="mt-1 text-xs text-[#8b776c]">{settings.phoneNumber}</p>
                  <p className="mt-0.5 text-xs text-[#8b776c]">{settings.businessHours}</p>
                </div>
              </div>
            </div>

            {/* Google Map */}
            <div className="overflow-hidden rounded-[24px] border border-[#e5dbd3] bg-white">
              <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation La Coquette"
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              <div className="flex items-center justify-between border-t border-[#eee6df] px-6 py-4">
                <div>
                  <p className="text-xs font-semibold text-[#4a3027]">La Coquette</p>
                  <p className="text-[10px] text-[#8b776c]">{settings.storeAddress}</p>
                </div>
                <a
                  href={openMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 items-center gap-2 rounded-full bg-[#6f4e37] px-5 text-[11px] font-bold text-white transition hover:bg-[#5a3b2e]"
                >
                  <MapPin size={14} /> Ouvrir dans Google Maps
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#fffdfa] px-5 pb-28 pt-12 sm:pb-10 sm:pt-16">
        <div className="mx-auto grid max-w-[1300px] gap-10 sm:grid-cols-3 sm:items-start">
          <div><p className="font-serif text-3xl font-semibold">La Coquette</p><p className="mt-3 max-w-xs text-xs leading-6 text-[#8b776c]">Maison algérienne de mode féminine. Des silhouettes contemporaines, pensées avec grâce à Alger.</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7568]">{t("ourUniverse")}</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#6d574c]"><Link href="/">{t("shop")}</Link><a href="/#delivery">{t("delivery")}</a><Link href="/contact">Contact</Link><Link href="/admin/login">Administration</Link></div></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7568]">{t("follow")}</p><div className="mt-4 flex flex-col gap-3 text-xs text-[#6d574c]"><a href={`tel:${settings.phoneNumber}`} className="flex items-center gap-2"><Phone size={14} /> {settings.phoneNumber}</a><a href={`mailto:${settings.emailAddress}`} className="flex items-center gap-2"><Mail size={14} /> {settings.emailAddress}</a><div className="mt-2 flex gap-2"><a href={settings.instagramLink} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-11 place-items-center rounded-full border border-[#ded2c8] hover:bg-[#efe6de]"><Instagram size={17} /></a><a href={settings.facebookLink} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-11 place-items-center rounded-full border border-[#ded2c8] hover:bg-[#efe6de]"><Facebook size={17} /></a><a href={toWhatsAppLink(settings.whatsappNumber)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid size-11 place-items-center rounded-full border border-[#ded2c8] hover:bg-[#efe6de]"><MessageCircle size={17} /></a></div></div></div>
        </div>
        <div className="mx-auto mt-12 max-w-[1300px] border-t border-[#e9dfd6] pt-5 text-[10px] text-[#99867b]">© {new Date().getFullYear()} La Coquette. {t("rights")}</div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-3 bottom-3 z-40 grid h-16 grid-cols-4 rounded-[22px] border border-white/70 bg-white/92 px-2 shadow-[0_12px_40px_rgba(76,51,38,.18)] backdrop-blur-xl sm:hidden">
        <Link href="/" className="flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold text-[#62483a]"><Sparkles size={19} />{t("shop")}</Link>
        <Link href="/contact" className="flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold text-[#6f4e37]"><Phone size={19} />Contact</Link>
        <Link href="/" className="flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold text-[#62483a]"><Search size={19} />{t("searchShort")}</Link>
        <Link href="/" className="flex flex-col items-center justify-center gap-0.5 text-[9px] font-semibold text-[#62483a]"><ShoppingBag size={19} />{t("cart")}</Link>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && <><motion.button aria-label={t("close")} className="fixed inset-0 z-[60] bg-[#35231d]/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.aside initial={{ x: isRtl ? "100%" : "-100%" }} animate={{ x: 0 }} exit={{ x: isRtl ? "100%" : "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 31 }} className="fixed inset-y-0 start-0 z-[70] w-[86%] max-w-sm bg-[#fffdfa] p-6 shadow-2xl"><div className="flex items-center justify-between"><span className="font-serif text-3xl font-semibold">La Coquette</span><button onClick={() => setMenuOpen(false)} className="grid size-11 place-items-center rounded-full bg-[#f2ebe4]"><X size={19} /></button></div><nav className="mt-12 flex flex-col gap-2"><Link href="/" onClick={() => setMenuOpen(false)} className="border-b border-[#ece2d9] py-4 font-serif text-3xl">{t("shop")}</Link><Link href="/contact" onClick={() => setMenuOpen(false)} className="border-b border-[#ece2d9] py-4 font-serif text-3xl">Contact</Link><a href="/#delivery" onClick={() => setMenuOpen(false)} className="border-b border-[#ece2d9] py-4 font-serif text-3xl">{t("delivery")}</a></nav><div className="mt-10 flex gap-2">{languages.map((item) => <button key={item.value} onClick={() => setLang(item.value)} className={`grid size-12 place-items-center rounded-full text-xs font-bold ${lang === item.value ? "bg-[#6f4e37] text-white" : "bg-[#eee6df]"}`}>{item.label}</button>)}</div><div className="mt-6 flex gap-2"><a href={settings.instagramLink} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-11 place-items-center rounded-full border border-[#ded2c8] hover:bg-[#efe6de]"><Instagram size={17} /></a><a href={settings.facebookLink} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-11 place-items-center rounded-full border border-[#ded2c8] hover:bg-[#efe6de]"><Facebook size={17} /></a><a href={toWhatsAppLink(settings.whatsappNumber)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid size-11 place-items-center rounded-full border border-[#ded2c8] hover:bg-[#efe6de]"><MessageCircle size={17} /></a></div></motion.aside></>}
      </AnimatePresence>
    </div>
  );
}
