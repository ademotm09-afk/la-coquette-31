import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { isAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { generateCsv, generateExcel } from "@/lib/export-utils";
import { asc, desc } from "drizzle-orm";

export async function GET(request: Request) {
  if (!(await isAdmin())) return unauthorizedResponse();
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "json";

    const [orderRows, itemRows] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(orderItems).orderBy(asc(orderItems.id)),
    ]);

    type OrderWithItems = (typeof orderRows)[number] & { items: typeof itemRows };
    const customerMap = new Map<string, {
      phone: string;
      name: string;
      count: number;
      totalSpent: number;
      lastOrderDate: Date;
      wilayas: Set<string>;
      orders: OrderWithItems[];
    }>();

    for (const order of orderRows) {
      const existing = customerMap.get(order.phone);
      const orderItemsList = itemRows.filter((item) => item.orderId === order.id);
      if (existing) {
        existing.count += 1;
        if (order.status !== "cancelled") existing.totalSpent += order.total;
        if (new Date(order.createdAt) > existing.lastOrderDate) existing.lastOrderDate = order.createdAt;
        existing.wilayas.add(order.wilayaName);
        existing.orders.push({ ...order, items: orderItemsList });
      } else {
        customerMap.set(order.phone, {
          phone: order.phone,
          name: order.customerName,
          count: 1,
          totalSpent: order.status === "cancelled" ? 0 : order.total,
          lastOrderDate: order.createdAt,
          wilayas: new Set([order.wilayaName]),
          orders: [{ ...order, items: orderItemsList }],
        });
      }
    }

    const customers = [...customerMap.values()]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .map((c) => ({
        ...c,
        wilayas: [...c.wilayas],
      }));

    if (format === "csv") {
      const headers = ["Nom", "Téléphone", "Wilaya(s)", "Total Commandes", "Total Dépensé (DA)", "Dernière Commande"];
      const rows = customers.map((c) => [
        c.name,
        c.phone,
        c.wilayas.join(", "),
        c.count,
        c.totalSpent,
        c.lastOrderDate.toLocaleDateString("fr-DZ"),
      ]);
      return generateCsv(headers, rows, "clients-la-coquette");
    }

    if (format === "excel") {
      const headers = ["Nom", "Téléphone", "Wilaya(s)", "Total Commandes", "Total Dépensé (DA)", "Dernière Commande"];
      const rows = customers.map((c) => [
        c.name,
        c.phone,
        c.wilayas.join(", "),
        c.count,
        c.totalSpent,
        c.lastOrderDate.toLocaleDateString("fr-DZ"),
      ]);
      return generateExcel(headers, rows, "clients-la-coquette", "Clients");
    }

    return Response.json({ customers, total: customers.length });
  } catch {
    return Response.json({ error: "Erreur lors du chargement des clients" }, { status: 500 });
  }
}
