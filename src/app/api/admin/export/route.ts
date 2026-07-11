import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { isAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { asc, desc } from "drizzle-orm";

const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export async function GET() {
  if (!(await isAdmin())) return unauthorizedResponse();
  const [orderRows, itemRows] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(orderItems).orderBy(asc(orderItems.id)),
  ]);
  const header = ["Commande", "Date", "Client", "Téléphone", "Wilaya", "Commune", "Adresse", "Produits", "Livraison", "Total", "Statut"];
  const rows = orderRows.map((order) => [
    order.orderNumber,
    order.createdAt.toLocaleString("fr-DZ"),
    order.customerName,
    order.phone,
    order.wilayaName,
    order.commune,
    order.address,
    itemRows.filter((item) => item.orderId === order.id).map((item) => `${item.productName} (${item.size}/${item.color}) x${item.quantity}`).join(" | "),
    order.shippingPrice,
    order.total,
    order.status,
  ]);
  const csv = `\uFEFF${[header, ...rows].map((row) => row.map(quote).join(";")).join("\n")}`;
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="commandes-la-coquette-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
