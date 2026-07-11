import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { isAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { asc, desc, eq, sql } from "drizzle-orm";

export async function GET() {
  if (!(await isAdmin())) return unauthorizedResponse();
  try {
    const [orderRows, itemRows, productRows] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(orderItems).orderBy(asc(orderItems.id)),
      db.select().from(products).orderBy(desc(products.salesCount)),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalRevenue = orderRows.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);
    const monthlyRevenue = orderRows.filter((o) => o.status !== "cancelled" && new Date(o.createdAt) >= monthStart).reduce((sum, o) => sum + o.total, 0);

    const ordersByStatus = {
      new: orderRows.filter((o) => o.status === "new").length,
      confirmed: orderRows.filter((o) => o.status === "confirmed").length,
      preparing: orderRows.filter((o) => o.status === "preparing").length,
      shipped: orderRows.filter((o) => o.status === "shipped").length,
      delivered: orderRows.filter((o) => o.status === "delivered").length,
      cancelled: orderRows.filter((o) => o.status === "cancelled").length,
    };

    const monthlySales: { month: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
      const revenue = orderRows
        .filter((o) => o.status !== "cancelled" && new Date(o.createdAt).getMonth() === d.getMonth() && new Date(o.createdAt).getFullYear() === d.getFullYear())
        .reduce((sum, o) => sum + o.total, 0);
      const count = orderRows.filter((o) => new Date(o.createdAt).getMonth() === d.getMonth() && new Date(o.createdAt).getFullYear() === d.getFullYear()).length;
      monthlySales.push({ month: monthLabel, revenue, orders: count });
    }

    const ordersByWilaya: { name: string; count: number; revenue: number }[] = [];
    const wilayaMap = new Map<string, { count: number; revenue: number }>();
    for (const order of orderRows) {
      const existing = wilayaMap.get(order.wilayaName) || { count: 0, revenue: 0 };
      existing.count += 1;
      if (order.status !== "cancelled") existing.revenue += order.total;
      wilayaMap.set(order.wilayaName, existing);
    }
    for (const [name, data] of wilayaMap) {
      ordersByWilaya.push({ name, count: data.count, revenue: data.revenue });
    }
    ordersByWilaya.sort((a, b) => b.revenue - a.revenue);

    const customerMap = new Map<string, { name: string; totalSpent: number; count: number }>();
    for (const order of orderRows) {
      const existing = customerMap.get(order.phone);
      if (existing) {
        existing.count += 1;
        if (order.status !== "cancelled") existing.totalSpent += order.total;
      } else {
        customerMap.set(order.phone, {
          name: order.customerName,
          totalSpent: order.status === "cancelled" ? 0 : order.total,
          count: 1,
        });
      }
    }
    const topCustomers = [...customerMap.values()].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

    const bestSellingProducts = productRows.slice(0, 10).map((p) => ({
      id: p.id,
      nameFr: p.nameFr,
      price: p.price,
      salesCount: p.salesCount,
      images: p.images,
      stock: p.stock,
    }));

    return Response.json({
      totalRevenue,
      monthlyRevenue,
      totalOrders: orderRows.length,
      ordersByStatus,
      monthlySales,
      ordersByWilaya: ordersByWilaya.slice(0, 20),
      topCustomers,
      bestSellingProducts,
    });
  } catch {
    return Response.json({ error: "Erreur lors du chargement des statistiques" }, { status: 500 });
  }
}
