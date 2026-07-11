import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { isAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { generateCsv, generateExcel, generatePdfHtml, money } from "@/lib/export-utils";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";

export async function GET(request: Request) {
  if (!(await isAdmin())) return unauthorizedResponse();
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "csv";
    const scope = url.searchParams.get("scope") || "all";
    const wilayaCode = url.searchParams.get("wilayaCode");
    const selectedIds = url.searchParams.get("ids");

    const conditions = [];

    if (scope === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      conditions.push(gte(orders.createdAt, today));
    } else if (scope === "monthly") {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      conditions.push(gte(orders.createdAt, monthStart));
    }

    if (wilayaCode) {
      conditions.push(eq(orders.wilayaCode, Number(wilayaCode)));
    }

    if (selectedIds) {
      const ids = selectedIds.split(",").map(Number).filter(Boolean);
      if (ids.length) conditions.push(sql`${orders.id} IN ${ids}`);
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [orderRows, itemRows] = await Promise.all([
      db.select().from(orders).where(whereClause).orderBy(desc(orders.createdAt)),
      db.select().from(orderItems).orderBy(asc(orderItems.id)),
    ]);

    const ordersWithItems = orderRows.map((order) => ({
      ...order,
      items: itemRows.filter((item) => item.orderId === order.id),
    }));

    const headers = ["Commande", "Date", "Client", "Téléphone", "Wilaya", "Commune", "Adresse", "Type Livraison", "Produits", "Livraison", "Total", "Statut"];
    const rows = ordersWithItems.map((order) => [
      order.orderNumber,
      order.createdAt.toLocaleString("fr-DZ"),
      order.customerName,
      order.phone,
      order.wilayaName,
      order.commune,
      order.address,
      order.deliveryType === "office" ? "Bureau" : "Domicile",
      order.items.map((item) => `${item.productName} (${item.size}/${item.color}) x${item.quantity}`).join(" | "),
      money(order.shippingPrice),
      money(order.total),
      order.status,
    ]);

    if (format === "excel") {
      return generateExcel(headers, rows, "commandes-la-coquette", "Commandes");
    }

    if (format === "pdf") {
      const title = `Commandes La Coquette — ${scope === "today" ? "Aujourd'hui" : scope === "monthly" ? "Ce mois" : "Toutes"}`;
      const companyHtml = `<div style="display:flex;justify-content:space-between;border-bottom:2px solid #6f4e37;padding-bottom:20px;margin-bottom:24px"><div><h1>La Coquette</h1><p class="muted">Maison de mode · Alger</p></div><div><strong>COMMANDES</strong><p class="muted">${new Date().toLocaleDateString("fr-DZ")} · ${ordersWithItems.length} commande(s)</p></div></div>`;
      const totalRevenue = ordersWithItems.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);
      const summaryHtml = `<div class="summary"><p class="muted">Total ${ordersWithItems.length} commandes</p><strong>${money(totalRevenue)}</strong></div>`;
      const pdfHtml = generatePdfHtml(title, companyHtml, headers, rows, summaryHtml);
      return new Response(pdfHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return generateCsv(headers, rows, "commandes-la-coquette");
  } catch {
    return Response.json({ error: "Erreur lors de l'export" }, { status: 500 });
  }
}
