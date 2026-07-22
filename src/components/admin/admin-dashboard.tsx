"use client";

import { FormEvent, useMemo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { BarChart3, Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, Edit3, ExternalLink, FileText, LayoutDashboard, LogOut, Menu, Package, Plus, Printer, Save, Search, Settings, ShoppingBag, Trash2, Truck, Upload, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Order, OrderItem, Product, ShippingRate } from "@/db/schema";
import type { SiteSettingsMap } from "@/lib/site-settings";
import { RevenueChart, OrdersByWilayaChart, OrderStatusChart } from "./admin-charts";

type AdminOrder = Order & { items: OrderItem[] };
type Tab = "dashboard" | "products" | "orders" | "customers" | "delivery" | "settings";

type Props = {
  initialProducts: Product[];
  initialOrders: AdminOrder[];
  initialRates: ShippingRate[];
  initialSettings: SiteSettingsMap;
  adminEmail: string;
};

type ProductForm = {
  id?: number;
  nameFr: string; nameEn: string; nameAr: string; categorySlug: string;
  descriptionFr: string; descriptionEn: string; descriptionAr: string;
  price: string; compareAtPrice: string; stock: string; sizes: string; colors: string; images: string;
  featured: boolean; isNew: boolean; active: boolean;
};

type WilayaForm = { code: number; name: string; homePrice: number; deskPrice: number; estimatedDays: number; active: boolean };
type CustomerDetail = { phone: string; name: string; count: number; total: number; last: Date; wilayas: string[]; orders: AdminOrder[] };

const emptyProduct: ProductForm = { nameFr: "", nameEn: "", nameAr: "", categorySlug: "robes", descriptionFr: "", descriptionEn: "", descriptionAr: "", price: "", compareAtPrice: "", stock: "0", sizes: "S, M, L, XL", colors: "Noisette:#8A6851, Crème:#EDE2D1", images: "", featured: false, isNew: true, active: true };

const statusLabels = { new: "Nouvelle", confirmed: "Confirmée", preparing: "Préparation", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée" } as const;
const statusColors = { new: "bg-[#eee4d8] text-[#76523d]", confirmed: "bg-[#e5e9f2] text-[#4e6083]", preparing: "bg-[#f5ead2] text-[#8b662a]", shipped: "bg-[#e0eced] text-[#3d6d70]", delivered: "bg-[#e4eee1] text-[#52704a]", cancelled: "bg-[#f4e1de] text-[#935346]" } as const;
const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "products", label: "Produits", icon: Package },
  { id: "orders", label: "Commandes", icon: ShoppingBag },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "delivery", label: "Livraison", icon: Truck },
  { id: "settings", label: "Paramètres", icon: Settings },
];

const money = (v: number) => `${new Intl.NumberFormat("fr-DZ").format(v)} DA`;
const safe = (v: unknown) => String(v ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c] || c);

export function AdminDashboard({ initialProducts, initialOrders, initialRates, initialSettings, adminEmail }: Props) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebar, setSidebar] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [rates, setRates] = useState(initialRates);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsMap>(initialSettings);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [productModal, setProductModal] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"all" | "today" | "monthly">("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [wilayaModal, setWilayaModal] = useState(false);
  const [wilayaForm, setWilayaForm] = useState<WilayaForm>({ code: 0, name: "", homePrice: 600, deskPrice: 450, estimatedDays: 3, active: true });
  const [editingWilaya, setEditingWilaya] = useState(false);
  const [deliverySearch, setDeliverySearch] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [orderSort, setOrderSort] = useState<"newest" | "oldest" | "priceHigh" | "priceLow">("newest");
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 10;
  const [stats, setStats] = useState<{ monthlySales: { month: string; revenue: number; orders: number }[]; ordersByWilaya: { name: string; count: number; revenue: number }[]; topCustomers: { name: string; totalSpent: number; count: number }[]; bestSellingProducts: { id: number; nameFr: string; price: number; salesCount: number; images: string[]; stock: number }[]; ordersByStatus: { new: number; confirmed: number; preparing: number; shipped: number; delivered: number; cancelled: number } } | null>(null);

  useEffect(() => {
    if (tab === "dashboard" && !stats) {
      fetch("/api/admin/stats").then((r) => r.json()).then(setStats).catch(() => {});
    }
  }, [tab, stats]);

  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const filteredOrders = useMemo(() => {
    const t = search.toLowerCase();
    const fromDate = orderDateFrom ? new Date(orderDateFrom) : null;
    const toDate = orderDateTo ? new Date(orderDateTo + "T23:59:59") : null;
    const result = orders.filter((o) => {
      const matchStatus = status === "all" || o.status === status;
      const matchSearch = !t || [o.orderNumber, o.customerName, o.phone, o.wilayaName].some((v) => v.toLowerCase().includes(t));
      const orderDate = new Date(o.createdAt);
      const matchFrom = !fromDate || orderDate >= fromDate;
      const matchTo = !toDate || orderDate <= toDate;
      return matchStatus && matchSearch && matchFrom && matchTo;
    });
    result.sort((a, b) => {
      if (orderSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (orderSort === "priceHigh") return b.total - a.total;
      if (orderSort === "priceLow") return a.total - b.total;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [orders, search, status, orderDateFrom, orderDateTo, orderSort]);
  const orderPageCount = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const paginatedOrders = filteredOrders.slice((orderPage - 1) * ordersPerPage, orderPage * ordersPerPage);

  const customers = useMemo(() => {
    const g = new Map<string, CustomerDetail>();
    orders.forEach((order) => {
      const c = g.get(order.phone);
      if (c) {
        c.count++; c.total += order.status === "cancelled" ? 0 : order.total;
        if (new Date(order.createdAt) > new Date(c.last)) c.last = order.createdAt;
        if (!c.wilayas.includes(order.wilayaName)) c.wilayas.push(order.wilayaName);
        c.orders.push({ ...order, items: order.items || [] });
      } else {
        g.set(order.phone, { phone: order.phone, name: order.customerName, count: 1, total: order.status === "cancelled" ? 0 : order.total, last: order.createdAt, wilayas: [order.wilayaName], orders: [{ ...order, items: order.items || [] }] });
      }
    });
    return [...g.values()].sort((a, b) => b.total - a.total);
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const t = customerSearch.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(t) || c.phone.includes(t) || c.wilayas.some((w) => w.toLowerCase().includes(t)));
  }, [customers, customerSearch]);

  const months = useMemo(() => {
    if (stats?.monthlySales) return stats.monthlySales;
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
      const v = orders.filter((o) => o.status !== "cancelled" && new Date(o.createdAt).getMonth() === d.getMonth() && new Date(o.createdAt).getFullYear() === d.getFullYear()).reduce((s, o) => s + o.total, 0);
      return { month: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""), revenue: v, orders: 0 };
    });
  }, [orders, stats]);

  const chartMax = Math.max(...months.map((m) => m.revenue), 1);
  const bestProducts = stats?.bestSellingProducts || [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
  const filteredRates = useMemo(() => {
    if (!deliverySearch) return rates;
    const t = deliverySearch.toLowerCase();
    return rates.filter((r) => r.name.toLowerCase().includes(t) || String(r.code).includes(t));
  }, [rates, deliverySearch]);

  const flash = (msg: string) => { setNotice(msg); window.setTimeout(() => setNotice(""), 2600); };
  const selectTab = (next: Tab) => { setTab(next); setSidebar(false); setSearch(""); setCustomerSearch(""); setDeliverySearch(""); setSelectedOrders([]); setExportOpen(false); setOrderPage(1); setOrderDateFrom(""); setOrderDateTo(""); };

  const openProduct = (product?: Product) => {
    if (!product) setProductForm(emptyProduct);
    else setProductForm({ id: product.id, nameFr: product.nameFr, nameEn: product.nameEn, nameAr: product.nameAr, categorySlug: product.categorySlug, descriptionFr: product.descriptionFr, descriptionEn: product.descriptionEn, descriptionAr: product.descriptionAr, price: String(product.price), compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "", stock: String(product.stock), sizes: product.sizes.join(", "), colors: product.colors.map((c) => `${c.name}:${c.hex}`).join(", "), images: product.images.join("\n"), featured: product.featured, isNew: product.isNew, active: product.active });
    setProductModal(true);
  };

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const colors = productForm.colors.split(",").map((entry) => { const [name, hex] = entry.trim().split(":"); return { name: name || "Noisette", hex: hex || "#8A6851" }; });
      const payload = { ...productForm, price: Number(productForm.price), compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : null, stock: Number(productForm.stock), sizes: productForm.sizes.split(",").map((i) => i.trim()).filter(Boolean), colors, images: productForm.images.split(/[\n,]/).map((i) => i.trim()).filter(Boolean) };
      const res = await fetch(productForm.id ? `/api/products/${productForm.id}` : "/api/products", { method: productForm.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur");
      setProducts((c) => productForm.id ? c.map((i) => i.id === result.id ? result : i) : [result, ...c]);
      setProductModal(false); flash(productForm.id ? "Produit mis à jour" : "Produit ajouté");
    } catch (err) { flash(err instanceof Error ? err.message : "Erreur"); }
    finally { setSaving(false); }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return; setUploading(true);
    const body = new FormData(); Array.from(files).forEach((f) => body.append("files", f));
    try { const res = await fetch("/api/upload", { method: "POST", body }); const r = await res.json(); if (!res.ok) throw new Error(r.error); setProductForm((c) => ({ ...c, images: [c.images, ...r.urls].filter(Boolean).join("\n") })); flash("Images ajoutées"); }
    catch (err) { flash(err instanceof Error ? err.message : "Upload impossible"); }
    finally { setUploading(false); }
  };

  const deleteProduct = async (p: Product) => {
    if (!window.confirm(`Supprimer « ${p.nameFr} » ?`)) return;
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    if (res.ok) { setProducts((c) => c.filter((i) => i.id !== p.id)); flash("Produit supprimé"); }
  };

  const updateStatus = async (orderId: number, next: keyof typeof statusLabels) => {
    const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (res.ok) { setOrders((c) => c.map((o) => o.id === orderId ? { ...o, status: next, updatedAt: new Date() } : o)); flash("Statut mis à jour"); }
  };

  const saveRate = async (rate: ShippingRate) => {
    const res = await fetch("/api/shipping", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rate) });
    if (res.ok) flash(`Tarif ${rate.name} enregistré`); else flash("Erreur");
  };

  const toggleRateActive = async (rate: ShippingRate) => {
    const res = await fetch("/api/shipping", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...rate, active: !rate.active }) });
    if (res.ok) { setRates((c) => c.map((r) => r.code === rate.code ? { ...r, active: !r.active } : r)); flash(`${rate.name} ${rate.active ? "désactivée" : "activée"}`); }
  };

  const saveWilaya = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/shipping", { method: editingWilaya ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(wilayaForm) });
      const r = await res.json(); if (!res.ok) throw new Error(r.error);
      if (editingWilaya) setRates((c) => c.map((i) => i.code === wilayaForm.code ? { ...i, ...wilayaForm } : i));
      else setRates((c) => [...c, { ...wilayaForm, id: Date.now(), updatedAt: new Date() } as ShippingRate].sort((a, b) => a.code - b.code));
      setWilayaModal(false); flash(editingWilaya ? "Wilaya mise à jour" : "Wilaya ajoutée");
    } catch (err) { flash(err instanceof Error ? err.message : "Erreur"); }
    finally { setSaving(false); }
  };

  const deleteWilaya = async (rate: ShippingRate) => {
    if (!window.confirm(`Supprimer « ${rate.name} » ?`)) return;
    const res = await fetch("/api/shipping", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: rate.code }) });
    if (res.ok) { setRates((c) => c.filter((i) => i.code !== rate.code)); flash("Wilaya supprimée"); }
  };

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(siteSettings) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur");
      setSiteSettings(result);
      flash("Paramètres enregistrés");
    } catch (err) { flash(err instanceof Error ? err.message : "Erreur"); }
    finally { setSaving(false); }
  };

  const printInvoice = (order: AdminOrder) => {
    const popup = window.open("", "_blank", "width=850,height=900"); if (!popup) return;
    const items = order.items.map((i) => `<tr><td style="padding:12px 14px;border-bottom:1px solid #eee"><strong>${safe(i.productName)}</strong><br><span style="color:#998;font-size:11px">${safe(i.size)} · ${safe(i.color)}</span></td><td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:right">${money(i.unitPrice)}</td><td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:right;font-weight:700">${money(i.total)}</td></tr>`).join("");
    const dtype = (order as AdminOrder & { deliveryType?: string }).deliveryType === "office" ? "Bureau" : "Domicile";
    popup.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${safe(order.orderNumber)}</title><style>body{font-family:Arial,sans-serif;color:#3e2723;padding:50px;max-width:800px;margin:auto}h1{font-family:Georgia,serif;font-size:36px;margin:0;color:#4a3027}.top{display:flex;justify-content:space-between;border-bottom:2px solid #6f4e37;padding-bottom:24px}.meta{margin:30px 0;display:grid;grid-template-columns:1fr 1fr;gap:30px}table{width:100%;border-collapse:collapse}th{text-align:left;padding:10px 14px;border-bottom:2px solid #6f4e37;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7b675d}.total{text-align:right;margin-top:24px;padding-top:16px;border-top:2px solid #6f4e37}.muted{color:#88756b;font-size:12px}.badge{display:inline-block;background:#6f4e37;color:white;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700}@media print{body{padding:20px}}</style></head><body><div class="top"><div><h1>La Coquette</h1><p class="muted">Maison de mode · Alger</p></div><div style="text-align:right"><span class="badge">FACTURE</span><p style="margin-top:12px"><strong>${safe(order.orderNumber)}</strong><br><span class="muted">${new Date(order.createdAt).toLocaleDateString("fr-DZ")}</span></p></div></div><div class="meta"><div><strong style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7b675d">CLIENTE</strong><p style="margin-top:8px"><strong>${safe(order.customerName)}</strong><br>${safe(order.phone)}</p></div><div><strong style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7b675d">LIVRAISON</strong><p style="margin-top:8px">${safe(order.address)}<br>${safe(order.commune)}, ${safe(order.wilayaName)}<br><span class="muted">${dtype}</span></p></div></div><table><thead><tr><th>Produit</th><th style="text-align:center">Qté</th><th style="text-align:right">Prix</th><th style="text-align:right">Total</th></tr></thead><tbody>${items}</tbody></table><div class="total"><p class="muted">Sous-total: ${money(order.subtotal)}</p><p class="muted">Livraison: ${money(order.shippingPrice)}</p><p style="font-size:22px;margin-top:8px"><strong>Total: ${money(order.total)}</strong></p></div><p class="muted" style="margin-top:40px;text-align:center">Merci pour votre commande ! — La Coquette · Alger</p><script>window.onload=()=>window.print()<\/script></body></html>`);
    popup.document.close();
  };

  const exportOrders = useCallback((fmt: "csv" | "excel" | "pdf") => {
    const p = new URLSearchParams({ format: fmt, scope: exportScope });
    if (selectedOrders.length) p.set("ids", selectedOrders.join(","));
    window.open(`/api/admin/orders/export?${p.toString()}`, "_blank"); setExportOpen(false);
  }, [exportScope, selectedOrders]);

  const exportCustomers = useCallback((fmt: "csv" | "excel") => {
    window.open(`/api/admin/customers?format=${fmt}`, "_blank");
  }, []);

  const toggleOrderSelect = (id: number) => setSelectedOrders((c) => c.includes(id) ? c.filter((i) => i !== id) : [...c, id]);
  const toggleAllOrders = () => setSelectedOrders((c) => c.length === filteredOrders.length ? [] : filteredOrders.map((o) => o.id));

  const title = navItems.find((i) => i.id === tab)?.label;
  const fc = "h-12 w-full rounded-xl border border-[#ded4cc] bg-white px-3 text-sm outline-none focus:border-[#7d5d49] focus:ring-3 focus:ring-[#7d5d49]/10";

  return (
    <div className="min-h-screen bg-[#f5f1ec] text-[#3e2723]">
      <AnimatePresence>{notice && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="fixed start-1/2 top-5 z-[120] -translate-x-1/2 rounded-full bg-[#4d382e] px-5 py-3 text-xs font-semibold text-white shadow-xl">{notice}</motion.div>}</AnimatePresence>
      {sidebar && <button onClick={() => setSidebar(false)} className="fixed inset-0 z-40 bg-[#2d1d18]/30 backdrop-blur-sm lg:hidden" aria-label="Fermer" />}

      <aside className={`fixed inset-y-0 start-0 z-50 flex w-[270px] flex-col border-e border-[#e7ddd5] bg-[#fffdfa] p-5 transition-transform duration-300 lg:translate-x-0 ${sidebar ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"}`}>
        <div className="flex h-14 items-center justify-between px-2"><Link href="/" className="font-serif text-[27px] font-semibold">La Coquette</Link><button onClick={() => setSidebar(false)} className="grid size-10 place-items-center rounded-full bg-[#f2ebe5] lg:hidden"><X size={18} /></button></div>
        <p className="px-2 pt-1 text-[8px] font-bold uppercase tracking-[.25em] text-[#a08776]">Administration</p>
        <nav className="mt-10 space-y-1.5">{navItems.map((item) => <button key={item.id} onClick={() => selectTab(item.id)} className={`flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition ${tab === item.id ? "bg-[#6f4e37] text-white shadow-[0_8px_22px_rgba(99,67,48,.16)]" : "text-[#79665b] hover:bg-[#f2ebe5]"}`}><item.icon size={18} strokeWidth={1.8} />{item.label}{item.id === "orders" && orders.filter((o) => o.status === "new").length > 0 && <span className={`ms-auto grid min-w-5 place-items-center rounded-full px-1 text-[9px] leading-5 ${tab === item.id ? "bg-white/20" : "bg-[#e7d7c9]"}`}>{orders.filter((o) => o.status === "new").length}</span>}</button>)}</nav>
        <div className="mt-auto border-t border-[#eae1da] pt-4"><p className="truncate px-3 text-[10px] text-[#99857a]">{adminEmail}</p><button onClick={() => signOut({ callbackUrl: "/admin/login" })} className="mt-2 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-[#80685c] hover:bg-[#f2ebe5]"><LogOut size={16} /> Déconnexion</button></div>
      </aside>

      <div className="lg:ps-[270px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#e7ddd5] bg-[#f9f6f2]/90 px-4 backdrop-blur-xl sm:px-7 lg:h-[82px] lg:px-10"><div className="flex items-center gap-3"><button onClick={() => setSidebar(true)} className="grid size-11 place-items-center rounded-full bg-white shadow-sm lg:hidden"><Menu size={19} /></button><div><h1 className="font-serif text-2xl font-semibold sm:text-3xl">{title}</h1><p className="hidden text-[10px] text-[#9a887e] sm:block">Gérez votre boutique en temps réel</p></div></div><div className="flex items-center gap-2"><Link href="/" target="_blank" className="flex h-11 items-center gap-2 rounded-full border border-[#ddd2c9] bg-white px-4 text-xs font-semibold text-[#684c3e]"><ExternalLink size={15} /><span className="hidden sm:inline">Voir la boutique</span></Link>{tab === "products" && <button onClick={() => openProduct()} className="flex h-11 items-center gap-2 rounded-full bg-[#6f4e37] px-4 text-xs font-bold text-white"><Plus size={16} /><span className="hidden sm:inline">Ajouter</span></button>}</div></header>

        <main className="p-4 pb-20 sm:p-7 lg:p-10">
          {/* DASHBOARD */}
          {tab === "dashboard" && <section>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-5">
              {[["Chiffre d'affaires", money(revenue), BarChart3, "Total", "bg-[#6f4e37] text-white"], ["Commandes", String(orders.length), ShoppingBag, "Toutes", "bg-white"], ["En attente", String(orders.filter((o) => o.status === "new").length), Package, "À confirmer", "bg-white"], ["Livrées", String(orders.filter((o) => o.status === "delivered").length), Truck, "Terminées", "bg-white"]].map(([label, value, Icon, hint, tone], i) => { const CI = Icon as typeof BarChart3; return <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }} key={String(label)} className={`min-w-0 rounded-[22px] border border-[#e8dfd8] p-4 shadow-[0_8px_28px_rgba(72,49,38,.04)] sm:p-5 ${tone}`}><div className="flex items-start justify-between"><p className={`text-[10px] font-bold uppercase tracking-[.1em] ${i === 0 ? "text-white/65" : "text-[#9a867b]"}`}>{String(label)}</p><CI size={18} strokeWidth={1.6} /></div><strong className="mt-5 block truncate text-lg font-bold sm:text-2xl">{String(value)}</strong><span className={`mt-1 block text-[9px] ${i === 0 ? "text-white/65" : "text-[#a18d81]"}`}>{String(hint)}</span></motion.article>; })}
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
              <article className="rounded-[24px] border border-[#e8dfd8] bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-serif text-2xl font-semibold">Revenus mensuels</h2><p className="mt-1 text-[10px] text-[#9b887d]">6 derniers mois</p></div></div><div className="mt-4"><RevenueChart data={months.map((m) => ({ month: m.month, revenue: m.revenue, orders: m.orders }))} /></div></article>
              <article className="rounded-[24px] border border-[#e8dfd8] bg-white p-5 sm:p-7"><h2 className="font-serif text-2xl font-semibold">Meilleures ventes</h2><div className="mt-5 space-y-4">{bestProducts.map((p, i) => <div key={p.id} className="flex items-center gap-3"><span className="w-4 text-xs font-bold text-[#a08c7f]">{i + 1}</span><div className="relative size-12 overflow-hidden rounded-xl bg-[#eee5dd]"><Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{p.nameFr}</p><p className="mt-1 text-[9px] text-[#9b887d]">{p.salesCount} ventes</p></div><strong className="text-xs text-[#6f4e37]">{money(p.price)}</strong></div>)}</div></article>
            </div>
            {stats && <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <article className="rounded-[24px] border border-[#e8dfd8] bg-white p-5 sm:p-7"><h2 className="font-serif text-2xl font-semibold">Statuts</h2><OrderStatusChart data={[{ name: "Nouvelles", value: stats.ordersByStatus.new }, { name: "Confirmées", value: stats.ordersByStatus.confirmed }, { name: "Préparation", value: stats.ordersByStatus.preparing }, { name: "Expédiées", value: stats.ordersByStatus.shipped }, { name: "Livrées", value: stats.ordersByStatus.delivered }, { name: "Annulées", value: stats.ordersByStatus.cancelled }]} /></article>
              <article className="rounded-[24px] border border-[#e8dfd8] bg-white p-5 sm:p-7"><h2 className="font-serif text-2xl font-semibold">Par Wilaya</h2><OrdersByWilayaChart data={stats.ordersByWilaya} /></article>
            </div>}
            {stats && <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <article className="rounded-[24px] border border-[#e8dfd8] bg-white p-5 sm:p-7"><h2 className="font-serif text-2xl font-semibold">Meilleures clientes</h2><div className="mt-5 space-y-3">{stats.topCustomers.slice(0, 8).map((c, i) => <div key={i} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[#faf7f4]"><div className="grid size-9 place-items-center rounded-full bg-[#eee5dd] font-serif text-sm font-bold text-[#6c4b3a]">{c.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{c.name}</p><p className="text-[9px] text-[#9b887d]">{c.count} commande(s)</p></div><strong className="text-xs text-[#6f4e37]">{money(c.totalSpent)}</strong></div>)}</div></article>
              <article className="rounded-[24px] border border-[#e8dfd8] bg-white p-5 sm:p-7"><h2 className="font-serif text-2xl font-semibold">Top Wilayas</h2><div className="mt-5 space-y-3">{stats.ordersByWilaya.slice(0, 8).map((w, i) => <div key={i} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[#faf7f4]"><span className="grid size-9 place-items-center rounded-full bg-[#eee5dd] text-[10px] font-bold text-[#704f3c]">{i + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{w.name}</p><p className="text-[9px] text-[#9b887d]">{w.count} commande(s)</p></div><strong className="text-xs text-[#6f4e37]">{money(w.revenue)}</strong></div>)}</div></article>
            </div>}
            <article className="mt-5 overflow-hidden rounded-[24px] border border-[#e8dfd8] bg-white"><div className="flex items-center justify-between p-5 sm:px-7"><div><h2 className="font-serif text-2xl font-semibold">Commandes récentes</h2><p className="text-[10px] text-[#9b887d]">Les dernières commandes reçues</p></div><button onClick={() => setTab("orders")} className="text-[10px] font-bold uppercase tracking-[.1em] text-[#74513d]">Tout voir</button></div><OrderTable orders={orders.slice(0, 5)} onStatus={updateStatus} onPrint={printInvoice} /></article>
          </section>}

          {/* PRODUCTS */}
          {tab === "products" && <section><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="relative block w-full max-w-md"><Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#948074]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…" className="h-12 w-full rounded-full border border-[#e0d6ce] bg-white pe-4 ps-11 text-sm outline-none focus:border-[#876651]" /></label><p className="text-xs text-[#8e7a6f]">{products.length} produits · {products.reduce((s, p) => s + p.stock, 0)} unités</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{products.filter((p) => !search || p.nameFr.toLowerCase().includes(search.toLowerCase())).map((p) => <article key={p.id} className="overflow-hidden rounded-[22px] border border-[#e6dcd4] bg-white"><div className="grid grid-cols-[105px_1fr]"><div className="relative min-h-36 bg-[#eee5dd]"><Image src={p.images[0]} alt={p.nameFr} fill sizes="120px" className="object-cover" /></div><div className="min-w-0 p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{p.nameFr}</p><p className="mt-1 text-[9px] uppercase tracking-[.1em] text-[#9b867a]">{p.categorySlug}</p></div><span className={`size-2 rounded-full ${p.active ? "bg-[#79936e]" : "bg-[#b89f91]"}`} /></div><strong className="mt-3 block text-sm text-[#704d39]">{money(p.price)}</strong><p className={`mt-1 text-[10px] ${p.stock < 10 ? "text-[#a15c43]" : "text-[#88766b]"}`}>Stock: {p.stock}</p><div className="mt-3 flex gap-1.5"><button onClick={() => openProduct(p)} className="grid size-9 place-items-center rounded-full bg-[#f1eae4] text-[#684a3b]"><Edit3 size={14} /></button><button onClick={() => deleteProduct(p)} className="grid size-9 place-items-center rounded-full bg-[#fef0ed] text-[#a15c43]"><Trash2 size={14} /></button></div></div></div></article>)}</div></section>}

          {/* ORDERS */}
          {tab === "orders" && <section>
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap"><label className="relative block w-full max-w-md"><Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#948074]" /><input value={search} onChange={(e) => { setSearch(e.target.value); setOrderPage(1); }} placeholder="Commande, cliente, téléphone…" className="h-12 w-full rounded-full border border-[#e0d6ce] bg-white pe-4 ps-11 text-sm outline-none" /></label><select value={status} onChange={(e) => { setStatus(e.target.value); setOrderPage(1); }} className="h-12 rounded-full border border-[#e0d6ce] bg-white px-4 text-xs font-semibold outline-none"><option value="all">Tous les statuts</option>{Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><input type="date" value={orderDateFrom} onChange={(e) => { setOrderDateFrom(e.target.value); setOrderPage(1); }} className="h-12 rounded-full border border-[#e0d6ce] bg-white px-4 text-xs outline-none" title="Date début" /><input type="date" value={orderDateTo} onChange={(e) => { setOrderDateTo(e.target.value); setOrderPage(1); }} className="h-12 rounded-full border border-[#e0d6ce] bg-white px-4 text-xs outline-none" title="Date fin" /><select value={orderSort} onChange={(e) => setOrderSort(e.target.value as typeof orderSort)} className="h-12 rounded-full border border-[#e0d6ce] bg-white px-4 text-xs font-semibold outline-none"><option value="newest">Plus récent</option><option value="oldest">Plus ancien</option><option value="priceHigh">Prix ↓</option><option value="priceLow">Prix ↑</option></select></div>
              <div className="flex items-center gap-2">
                {selectedOrders.length > 0 && <span className="rounded-full bg-[#eee5dc] px-3 py-2 text-[10px] font-bold text-[#765441]">{selectedOrders.length} sélectionnée(s)</span>}                <p className="text-[10px] text-[#9a887e]">{filteredOrders.length} commande(s)</p>                <div className="relative">
                  <button onClick={() => setExportOpen(!exportOpen)} className="flex h-12 items-center gap-2 rounded-full bg-[#6f4e37] px-5 text-xs font-bold text-white"><Download size={16} /> Exporter <ChevronDown size={14} /></button>
                  {exportOpen && <div className="absolute end-0 top-full z-20 mt-2 w-56 rounded-2xl border border-[#e8dfd8] bg-white p-2 shadow-xl">
                    <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-[#9a877c]">Période</p>
                    {([["all", "Toutes"], ["today", "Aujourd'hui"], ["monthly", "Ce mois"]] as const).map(([v, l]) => <button key={v} onClick={() => setExportScope(v)} className={`flex h-9 w-full items-center gap-2 rounded-xl px-3 text-xs transition ${exportScope === v ? "bg-[#eee5dc] font-semibold text-[#6f4e37]" : "text-[#79665b] hover:bg-[#f8f4f0]"}`}><Calendar size={13} /> {l}{exportScope === v && <span className="ms-auto size-1.5 rounded-full bg-[#6f4e37]" />}</button>)}
                    <div className="my-1.5 border-t border-[#eee6df]" />
                    <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-[#9a877c]">Format</p>
                    <button onClick={() => exportOrders("csv")} className="flex h-9 w-full items-center gap-2 rounded-xl px-3 text-xs text-[#79665b] hover:bg-[#f8f4f0]"><FileText size={13} /> CSV</button>
                    <button onClick={() => exportOrders("excel")} className="flex h-9 w-full items-center gap-2 rounded-xl px-3 text-xs text-[#79665b] hover:bg-[#f8f4f0]"><FileText size={13} /> Excel</button>
                    <button onClick={() => exportOrders("pdf")} className="flex h-9 w-full items-center gap-2 rounded-xl px-3 text-xs text-[#79665b] hover:bg-[#f8f4f0]"><FileText size={13} /> PDF</button>
                  </div>}
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-[#e7ddd5] bg-white"><OrderTable orders={paginatedOrders} onStatus={updateStatus} onPrint={printInvoice} selectedOrders={selectedOrders} onToggleSelect={toggleOrderSelect} onToggleAll={toggleAllOrders} empty="Aucune commande ne correspond à votre recherche." /></div>
            {orderPageCount > 1 && <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination commandes"><button disabled={orderPage === 1} onClick={() => setOrderPage(orderPage - 1)} className="grid size-10 place-items-center rounded-full border border-[#ded2c7] bg-white text-xs font-bold disabled:opacity-35"><ChevronLeft size={16} /></button>{Array.from({ length: Math.min(orderPageCount, 7) }, (_, i) => { let p: number; if (orderPageCount <= 7) p = i + 1; else if (orderPage <= 4) p = i + 1; else if (orderPage >= orderPageCount - 3) p = orderPageCount - 6 + i; else p = orderPage - 3 + i; return <button key={p} onClick={() => setOrderPage(p)} className={`grid size-10 place-items-center rounded-full text-xs font-bold ${orderPage === p ? "bg-[#6f4e37] text-white" : "bg-white text-[#674c3d]"}`}>{p}</button>; })}<button disabled={orderPage === orderPageCount} onClick={() => setOrderPage(orderPage + 1)} className="grid size-10 place-items-center rounded-full border border-[#ded2c7] bg-white text-xs font-bold disabled:opacity-35"><ChevronRight size={16} /></button></nav>}
          </section>}

          {/* CUSTOMERS */}
          {tab === "customers" && <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div><p className="text-sm text-[#8f7c70]">Clientes uniques</p><strong className="font-serif text-4xl">{customers.length}</strong></div>
                <label className="relative block w-full max-w-md sm:ms-4"><Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#948074]" /><input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Nom, téléphone, wilaya…" className="h-12 w-full rounded-full border border-[#e0d6ce] bg-white pe-4 ps-11 text-sm outline-none focus:border-[#876651]" /></label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportCustomers("csv")} className="flex h-11 items-center gap-2 rounded-full border border-[#ddd2c9] bg-white px-4 text-xs font-semibold text-[#684c3e]"><Download size={15} /> CSV</button>
                <button onClick={() => exportCustomers("excel")} className="flex h-11 items-center gap-2 rounded-full bg-[#6f4e37] px-4 text-xs font-bold text-white"><Download size={15} /> Excel</button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredCustomers.map((c) => <article key={c.phone} className="cursor-pointer rounded-[22px] border border-[#e5dbd3] bg-white p-5 transition hover:border-[#c9b5a5] hover:shadow-md" onClick={() => setCustomerDetail(c)}>
              <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-full bg-[#eee5dd] font-serif text-lg font-bold text-[#6c4b3a]">{c.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{c.name}</h3><p className="text-[10px] text-[#958176]" dir="ltr">{c.phone}</p></div></div>
              <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-[#f6f1ec] p-3"><div><span className="text-[9px] uppercase text-[#9b887c]">Commandes</span><strong className="block text-sm">{c.count}</strong></div><div><span className="text-[9px] uppercase text-[#9b887c]">Dépensé</span><strong className="block text-sm">{money(c.total)}</strong></div><div><span className="text-[9px] uppercase text-[#9b887c]">Wilaya(s)</span><strong className="block text-sm">{c.wilayas.length}</strong></div></div>
              <div className="mt-4 flex justify-between text-[10px] text-[#907c71]"><span>{c.wilayas.join(", ")}</span><span>{new Date(c.last).toLocaleDateString("fr-DZ")}</span></div>
            </article>)}</div>
            {!filteredCustomers.length && <div className="grid min-h-72 place-items-center rounded-3xl bg-white text-sm text-[#968277]">Les clientes apparaîtront après leur première commande.</div>}
          </section>}

          {/* DELIVERY */}
          {tab === "delivery" && <section>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl"><h2 className="font-serif text-3xl font-semibold">Tarifs par Wilaya</h2><p className="mt-2 text-sm leading-6 text-[#8c786d]">Gérez les prix de livraison. Les tarifs sont appliqués instantanément au checkout.</p></div>
              <div className="flex gap-2">
                <label className="relative"><Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#948074]" /><input value={deliverySearch} onChange={(e) => setDeliverySearch(e.target.value)} placeholder="Rechercher…" className="h-11 w-full rounded-full border border-[#e0d6ce] bg-white pe-4 ps-11 text-sm outline-none" /></label>
                <button onClick={() => { setEditingWilaya(false); setWilayaForm({ code: 1, name: "", homePrice: 600, deskPrice: 450, estimatedDays: 3, active: true }); setWilayaModal(true); }} className="flex h-11 items-center gap-2 rounded-full bg-[#6f4e37] px-4 text-xs font-bold text-white"><Plus size={16} /> Ajouter</button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredRates.map((rate) => <article key={rate.code} className={`rounded-[20px] border bg-white p-4 transition ${rate.active ? "border-[#e5dbd3]" : "border-[#e5dbd3] opacity-60"}`}>
              <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#eee5dc] text-[10px] font-bold text-[#704f3c]">{String(rate.code).padStart(2, "0")}</span><div><h3 className="text-sm font-semibold">{rate.name}</h3><p className="text-[9px] text-[#99857a]">Est. {rate.estimatedDays || 3} jour(s)</p></div></div><div className="flex gap-1">
                <button onClick={() => { setEditingWilaya(true); setWilayaForm({ code: rate.code, name: rate.name, homePrice: rate.homePrice, deskPrice: rate.deskPrice, estimatedDays: rate.estimatedDays || 3, active: rate.active }); setWilayaModal(true); }} className="grid size-8 place-items-center rounded-full bg-[#f1eae4] text-[#684a3b]"><Edit3 size={13} /></button>
                <button onClick={() => toggleRateActive(rate)} className={`grid size-8 place-items-center rounded-full ${rate.active ? "bg-[#e4eee1] text-[#52704a]" : "bg-[#f4e1de] text-[#935346]"}`} title={rate.active ? "Désactiver" : "Activer"}><span className={`size-2 rounded-full ${rate.active ? "bg-[#52704a]" : "bg-[#935346]"}`} /></button>
                <button onClick={() => deleteWilaya(rate)} className="grid size-8 place-items-center rounded-full bg-[#fef0ed] text-[#a15c43]"><Trash2 size={13} /></button>
              </div></div>
              <div className="grid grid-cols-2 gap-2"><label><span className="mb-1.5 block text-[9px] uppercase text-[#99857a]">Domicile (DA)</span><input type="number" min="0" value={rate.homePrice} onChange={(e) => setRates((c) => c.map((i) => i.code === rate.code ? { ...i, homePrice: Number(e.target.value) } : i))} className="h-11 w-full rounded-xl border border-[#e0d5cd] px-3 text-sm outline-none" /></label><label><span className="mb-1.5 block text-[9px] uppercase text-[#99857a]">Bureau (DA)</span><input type="number" min="0" value={rate.deskPrice} onChange={(e) => setRates((c) => c.map((i) => i.code === rate.code ? { ...i, deskPrice: Number(e.target.value) } : i))} className="h-11 w-full rounded-xl border border-[#e0d5cd] px-3 text-sm outline-none" /></label></div>
              <button onClick={() => saveRate(rate)} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#f0e8e1] text-[10px] font-bold uppercase tracking-[.08em] text-[#6d4c3b] hover:bg-[#6f4e37] hover:text-white"><Save size={13} /> Enregistrer</button>
            </article>)}</div>
          </section>}

          {/* SETTINGS */}
          {tab === "settings" && <section>
            <div className="max-w-3xl">
              <h2 className="font-serif text-3xl font-semibold">Paramètres du site</h2>
              <p className="mt-2 text-sm leading-6 text-[#8c786d]">Modifiez les informations de contact, les liens sociaux et les horaires. Les changements sont appliqués instantanément.</p>
            </div>
            <form onSubmit={saveSettings} className="mt-8 grid gap-5 rounded-[24px] border border-[#e8dfd8] bg-white p-6 sm:p-8">
              <div className="grid gap-4 md:grid-cols-2">
                <label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Numéro WhatsApp</span><input value={siteSettings.whatsappNumber} onChange={(e) => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })} className={fc} placeholder="0541442571" /></label>
                <label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Numéro de téléphone</span><input value={siteSettings.phoneNumber} onChange={(e) => setSiteSettings({ ...siteSettings, phoneNumber: e.target.value })} className={fc} placeholder="0541442571" /></label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Adresse email</span><input type="email" value={siteSettings.emailAddress} onChange={(e) => setSiteSettings({ ...siteSettings, emailAddress: e.target.value })} className={fc} placeholder="web.automation.310@gmail.com" /></label>
                <label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Adresse du magasin</span><input value={siteSettings.storeAddress} onChange={(e) => setSiteSettings({ ...siteSettings, storeAddress: e.target.value })} className={fc} placeholder="Alger, Algérie" /></label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Lien Instagram</span><input value={siteSettings.instagramLink} onChange={(e) => setSiteSettings({ ...siteSettings, instagramLink: e.target.value })} className={fc} placeholder="https://www.instagram.com/..." /></label>
                <label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Lien Facebook</span><input value={siteSettings.facebookLink} onChange={(e) => setSiteSettings({ ...siteSettings, facebookLink: e.target.value })} className={fc} placeholder="https://www.facebook.com/..." /></label>
              </div>
              <label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Lien Google Maps</span><input value={siteSettings.googleMapsLink} onChange={(e) => setSiteSettings({ ...siteSettings, googleMapsLink: e.target.value })} className={fc} placeholder="https://www.google.com/maps/..." /></label>
              <label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Horaires d&apos;ouverture</span><input value={siteSettings.businessHours} onChange={(e) => setSiteSettings({ ...siteSettings, businessHours: e.target.value })} className={fc} placeholder="Lun - Sam: 10:00 - 20:00" /></label>
              <button disabled={saving} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#65442f] to-[#846047] text-sm font-bold text-white disabled:opacity-60"><Save size={16} /> {saving ? "Enregistrement…" : "Enregistrer les paramètres"}</button>
            </form>
          </section>}
        </main>
      </div>

      {/* PRODUCT MODAL */}
      <AnimatePresence>{productModal && <><motion.button aria-label="Fermer" onClick={() => setProductModal(false)} className="fixed inset-0 z-[80] bg-[#30201a]/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.div role="dialog" aria-modal="true" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-x-0 bottom-0 z-[90] max-h-[94vh] overflow-y-auto rounded-t-[28px] bg-[#faf8f5] p-5 pb-8 shadow-2xl sm:inset-auto sm:start-1/2 sm:top-1/2 sm:w-[min(840px,94vw)] sm:max-h-[90vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7"><div className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/95 pb-5 backdrop-blur"><div><h2 className="font-serif text-3xl font-semibold">{productForm.id ? "Modifier le produit" : "Nouveau produit"}</h2><p className="text-[10px] text-[#99857a]">Informations disponibles en trois langues</p></div><button onClick={() => setProductModal(false)} className="grid size-11 place-items-center rounded-full bg-[#eee6df]"><X size={18} /></button></div><form onSubmit={saveProduct} className="grid gap-5">
        <div className="grid gap-3 md:grid-cols-3"><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Nom français *</span><input required value={productForm.nameFr} onChange={(e) => setProductForm({ ...productForm, nameFr: e.target.value })} className={fc} /></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Nom anglais</span><input value={productForm.nameEn} onChange={(e) => setProductForm({ ...productForm, nameEn: e.target.value })} className={fc} /></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Nom arabe</span><input dir="rtl" value={productForm.nameAr} onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })} className={fc} /></label></div>
        <div className="grid gap-3 md:grid-cols-3"><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Description FR</span><textarea value={productForm.descriptionFr} onChange={(e) => setProductForm({ ...productForm, descriptionFr: e.target.value })} className="h-24 w-full rounded-xl border border-[#ded4cc] bg-white p-3 text-sm outline-none" /></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Description EN</span><textarea value={productForm.descriptionEn} onChange={(e) => setProductForm({ ...productForm, descriptionEn: e.target.value })} className="h-24 w-full rounded-xl border border-[#ded4cc] bg-white p-3 text-sm outline-none" /></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Description AR</span><textarea dir="rtl" value={productForm.descriptionAr} onChange={(e) => setProductForm({ ...productForm, descriptionAr: e.target.value })} className="h-24 w-full rounded-xl border border-[#ded4cc] bg-white p-3 text-sm outline-none" /></label></div>
        <div className="grid gap-3 md:grid-cols-4"><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Catégorie</span><select value={productForm.categorySlug} onChange={(e) => setProductForm({ ...productForm, categorySlug: e.target.value })} className={fc}><option value="robes">Robes</option><option value="ensembles">Ensembles</option><option value="abayas">Abayas</option><option value="vestes">Vestes</option><option value="accessoires">Accessoires</option></select></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Prix (DA) *</span><input required type="number" min="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className={fc} /></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Prix barré</span><input type="number" min="0" value={productForm.compareAtPrice} onChange={(e) => setProductForm({ ...productForm, compareAtPrice: e.target.value })} className={fc} /></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Stock</span><input type="number" min="0" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className={fc} /></label></div>
        <div className="grid gap-3 md:grid-cols-2"><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Tailles</span><input value={productForm.sizes} onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })} className={fc} /></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Couleurs (Nom:#hex)</span><input value={productForm.colors} onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })} className={fc} /></label></div>
        <label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Images (URLs)</span><textarea value={productForm.images} onChange={(e) => setProductForm({ ...productForm, images: e.target.value })} className="h-28 w-full rounded-xl border border-[#ded4cc] bg-white p-3 font-mono text-[11px] outline-none" placeholder="https://..." /></label>
        <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#c9b5a5] bg-[#f6f0ea] text-xs font-semibold text-[#7d5d49] hover:bg-[#efe5db]"><Upload size={15} /> {uploading ? "Upload…" : "Ajouter des images"}<input type="file" multiple accept="image/*" className="hidden" onChange={(e) => uploadImages(e.target.files)} /></label>
        <div className="flex gap-4"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={productForm.featured} onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} className="accent-[#6f4e37]" /> À la une</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={productForm.isNew} onChange={(e) => setProductForm({ ...productForm, isNew: e.target.checked })} className="accent-[#6f4e37]" /> Nouveau</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={productForm.active} onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })} className="accent-[#6f4e37]" /> Actif</label></div>
        <button disabled={saving} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#65442f] to-[#846047] text-sm font-bold text-white disabled:opacity-60">{saving ? "Enregistrement…" : "Enregistrer"}</button>
      </form></motion.div></>}</AnimatePresence>

      {/* WILAYA MODAL */}
      <AnimatePresence>{wilayaModal && <><motion.button aria-label="Fermer" onClick={() => setWilayaModal(false)} className="fixed inset-0 z-[80] bg-[#30201a]/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.div role="dialog" aria-modal="true" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-x-0 bottom-0 z-[90] max-h-[80vh] overflow-y-auto rounded-t-[28px] bg-[#faf8f5] p-5 pb-8 shadow-2xl sm:inset-auto sm:start-1/2 sm:top-1/2 sm:w-[min(500px,94vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7"><div className="flex items-center justify-between pb-5"><div><h2 className="font-serif text-2xl font-semibold">{editingWilaya ? "Modifier la Wilaya" : "Ajouter une Wilaya"}</h2></div><button onClick={() => setWilayaModal(false)} className="grid size-10 place-items-center rounded-full bg-[#eee6df]"><X size={18} /></button></div>
        <form onSubmit={saveWilaya} className="grid gap-4">
          {!editingWilaya && <div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Code (1-58) *</span><input required type="number" min="1" max="58" value={wilayaForm.code} onChange={(e) => setWilayaForm({ ...wilayaForm, code: Number(e.target.value) })} className={fc} /></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Nom *</span><input required value={wilayaForm.name} onChange={(e) => setWilayaForm({ ...wilayaForm, name: e.target.value })} className={fc} /></label></div>}
          <div className="grid grid-cols-3 gap-3"><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Domicile (DA) *</span><input required type="number" min="0" value={wilayaForm.homePrice} onChange={(e) => setWilayaForm({ ...wilayaForm, homePrice: Number(e.target.value) })} className={fc} /></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Bureau (DA) *</span><input required type="number" min="0" value={wilayaForm.deskPrice} onChange={(e) => setWilayaForm({ ...wilayaForm, deskPrice: Number(e.target.value) })} className={fc} /></label><label><span className="mb-1.5 block text-[9px] font-bold uppercase text-[#8d786d]">Jours estimés</span><input type="number" min="1" max="30" value={wilayaForm.estimatedDays} onChange={(e) => setWilayaForm({ ...wilayaForm, estimatedDays: Number(e.target.value) })} className={fc} /></label></div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={wilayaForm.active} onChange={(e) => setWilayaForm({ ...wilayaForm, active: e.target.checked })} className="accent-[#6f4e37]" /> Active</label>
          <button disabled={saving} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6f4e37] text-sm font-bold text-white disabled:opacity-60">{saving ? "Enregistrement…" : "Enregistrer"}</button>
        </form>
      </motion.div></>}</AnimatePresence>

      {/* CUSTOMER DETAIL MODAL */}
      <AnimatePresence>{customerDetail && <><motion.button aria-label="Fermer" onClick={() => setCustomerDetail(null)} className="fixed inset-0 z-[80] bg-[#30201a]/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.div role="dialog" aria-modal="true" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-x-0 bottom-0 z-[90] max-h-[90vh] overflow-y-auto rounded-t-[28px] bg-[#faf8f5] p-5 pb-8 shadow-2xl sm:inset-auto sm:start-1/2 sm:top-1/2 sm:w-[min(700px,94vw)] sm:max-h-[85vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7">
        <div className="flex items-center justify-between pb-5"><div className="flex items-center gap-3"><div className="grid size-12 place-items-center rounded-full bg-[#eee5dd] font-serif text-xl font-bold text-[#6c4b3a]">{customerDetail.name.slice(0, 1)}</div><div><h2 className="font-serif text-2xl font-semibold">{customerDetail.name}</h2><p className="text-xs text-[#958176]" dir="ltr">{customerDetail.phone}</p></div></div><button onClick={() => setCustomerDetail(null)} className="grid size-10 place-items-center rounded-full bg-[#eee6df]"><X size={18} /></button></div>
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#f6f1ec] p-4"><div><span className="text-[9px] uppercase text-[#9b887c]">Commandes</span><strong className="block text-lg">{customerDetail.count}</strong></div><div><span className="text-[9px] uppercase text-[#9b887c]">Dépensé</span><strong className="block text-lg text-[#6f4e37]">{money(customerDetail.total)}</strong></div><div><span className="text-[9px] uppercase text-[#9b887c]">Dernière</span><strong className="block text-sm">{new Date(customerDetail.last).toLocaleDateString("fr-DZ")}</strong></div></div>
        <p className="mt-3 text-[10px] text-[#907c71]">Wilayas: {customerDetail.wilayas.join(", ")}</p>
        <h3 className="mt-6 font-serif text-xl font-semibold">Historique</h3>
        <div className="mt-3 space-y-3">{customerDetail.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((o) => <div key={o.id} className="rounded-2xl border border-[#e9e0d7] bg-white p-4"><div className="flex items-center justify-between"><div><strong className="text-xs text-[#624536]">{o.orderNumber}</strong><span className="ms-2 text-[9px] text-[#9b877b]">{new Date(o.createdAt).toLocaleDateString("fr-DZ")}</span></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${statusColors[o.status]}`}>{statusLabels[o.status]}</span></div><div className="mt-2 text-[10px] text-[#715d52]">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</div><div className="mt-2 flex items-center justify-between text-[10px]"><span className="text-[#99857a]">{o.wilayaName}</span><strong className="text-[#6f4e37]">{money(o.total)}</strong></div></div>)}</div>
      </motion.div></>}</AnimatePresence>
    </div>
  );
}

function OrderTable({ orders, onStatus, onPrint, selectedOrders = [], onToggleSelect, onToggleAll, empty = "Aucune commande pour le moment." }: { orders: AdminOrder[]; onStatus: (id: number, status: keyof typeof statusLabels) => void; onPrint: (order: AdminOrder) => void; selectedOrders?: number[]; onToggleSelect?: (id: number) => void; onToggleAll?: () => void; empty?: string }) {
  if (!orders.length) return <div className="grid min-h-48 place-items-center p-6 text-sm text-[#958176]">{empty}</div>;
  const allSel = selectedOrders.length === orders.length && orders.length > 0;
  return <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-start"><thead><tr className="border-b border-[#ece3dc] bg-[#faf7f4]">
    {onToggleSelect && <th className="px-3 py-4"><input type="checkbox" checked={allSel} onChange={onToggleAll} className="accent-[#6f4e37]" /></th>}
    <th className="px-5 py-4 text-start text-[9px] font-bold uppercase tracking-[.1em] text-[#9a877c]">Commande</th><th className="px-4 py-4 text-start text-[9px] font-bold uppercase tracking-[.1em] text-[#9a877c]">Cliente</th><th className="px-4 py-4 text-start text-[9px] font-bold uppercase tracking-[.1em] text-[#9a877c]">Produits</th><th className="px-4 py-4 text-start text-[9px] font-bold uppercase tracking-[.1em] text-[#9a877c]">Wilaya</th><th className="px-4 py-4 text-start text-[9px] font-bold uppercase tracking-[.1em] text-[#9a877c]">Total</th><th className="px-4 py-4 text-start text-[9px] font-bold uppercase tracking-[.1em] text-[#9a877c]">Statut</th><th className="px-4 py-4 text-start text-[9px] font-bold uppercase tracking-[.1em] text-[#9a877c]">Actions</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className={`border-b border-[#eee6df] last:border-0 hover:bg-[#fcfaf8] ${selectedOrders.includes(order.id) ? "bg-[#f9f3ee]" : ""}`}>
    {onToggleSelect && <td className="px-3 py-4"><input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => onToggleSelect(order.id)} className="accent-[#6f4e37]" /></td>}
    <td className="px-5 py-4"><strong className="block text-[11px] text-[#624536]">{order.orderNumber}</strong><span className="text-[9px] text-[#9b877b]">{new Date(order.createdAt).toLocaleDateString("fr-DZ")}</span></td><td className="px-4 py-4"><span className="block text-xs font-semibold">{order.customerName}</span><span className="text-[9px] text-[#99857a]" dir="ltr">{order.phone}</span></td><td className="max-w-[180px] px-4 py-4"><span className="block truncate text-[10px] text-[#715d52]">{order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</span><span className="text-[9px] text-[#9b877c]">{order.items.reduce((s, i) => s + i.quantity, 0)} article(s)</span></td><td className="px-4 py-4"><span className="block text-[11px] font-medium">{order.wilayaName}</span><span className="text-[9px] text-[#99857a]">{order.commune}</span></td><td className="px-4 py-4 text-xs font-bold text-[#6f4e37]">{money(order.total)}</td><td className="px-4 py-4"><select value={order.status} onChange={(e) => onStatus(order.id, e.target.value as keyof typeof statusLabels)} className={`rounded-full border-none px-3 py-1.5 text-[10px] font-bold outline-none ${statusColors[order.status]}`}>{Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td><td className="px-4 py-4"><div className="flex gap-1"><button onClick={() => onPrint(order)} title="Facture" className="grid size-8 place-items-center rounded-full bg-[#f1eae4] text-[#684a3b]"><Printer size={13} /></button></div></td></tr>)}</tbody></table></div>;
}
