import { db } from "@/db";
import { orderItems, orders, products, shippingRates } from "@/db/schema";
import { bootstrapStore } from "@/lib/data";
import { and, eq, inArray, sql } from "drizzle-orm";

type RequestedItem = { productId: number; quantity: number; size: string; color: string };

export async function POST(request: Request) {
  try {
    await bootstrapStore();
    const body = await request.json();
    const customer = body.customer as Record<string, unknown>;
    const requestedItems: RequestedItem[] = Array.isArray(body.items) ? (body.items as RequestedItem[]) : [];
    const fullName = String(customer?.fullName || "").trim();
    const phone = String(customer?.phone || "").replace(/[\s.-]/g, "");
    const commune = String(customer?.commune || "").trim();
    const address = String(customer?.address || "").trim();
    const wilayaCode = Number(customer?.wilayaCode);
    const deliveryType = (customer?.deliveryType === "office" ? "office" : "home") as "home" | "office";

    if (!fullName || !commune || !address || !wilayaCode || !requestedItems.length) {
      return Response.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }
    if (!/^(?:0|\+213|00213)[5-7]\d{8}$/.test(phone)) {
      return Response.json({ error: "Numéro de téléphone invalide" }, { status: 400 });
    }

    const ids = [...new Set(requestedItems.map((item: { productId: number }) => Number(item.productId)).filter(Boolean))];
    const [catalogItems, rateRows] = await Promise.all([
      db.select().from(products).where(and(inArray(products.id, ids), eq(products.active, true))),
      db.select().from(shippingRates).where(and(eq(shippingRates.code, wilayaCode), eq(shippingRates.active, true))).limit(1),
    ]);
    const rate = rateRows[0];
    if (!rate || catalogItems.length !== ids.length) return Response.json({ error: "Produit ou Wilaya invalide" }, { status: 400 });

    const checkedItems = requestedItems.map((requested: { productId: number; quantity: number; size: string; color: string }) => {
      const product = catalogItems.find((item) => item.id === Number(requested.productId));
      if (!product) throw new Error("Produit introuvable");
      const quantity = Math.min(10, Math.max(1, Number(requested.quantity) || 1));
      const size = String(requested.size || "");
      const color = String(requested.color || "");
      if (product.stock < quantity || !product.sizes.includes(size) || !product.colors.some((item) => item.name === color)) {
        throw new Error(`Option indisponible: ${product.nameFr}`);
      }
      return { product, quantity, size, color, total: product.price * quantity };
    });

    const subtotal = checkedItems.reduce((sum, item) => sum + item.total, 0);
    const shippingPrice = deliveryType === "office" ? rate.deskPrice : (wilayaCode === 16 && subtotal >= 25000 ? 0 : rate.homePrice);
    const total = subtotal + shippingPrice;
    const estimatedDays = rate.estimatedDays || 3;
    const now = new Date();
    const orderNumber = `LC-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;

    const created = await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        orderNumber,
        customerName: fullName,
        phone,
        wilayaCode,
        wilayaName: rate.name,
        commune,
        address,
        deliveryType,
        estimatedDays,
        note: customer?.note ? String(customer.note).trim() : null,
        subtotal,
        shippingPrice,
        total,
      }).returning();

      await tx.insert(orderItems).values(checkedItems.map((item) => ({
        orderId: order.id,
        productId: item.product.id,
        productName: item.product.nameFr,
        productImage: item.product.images[0],
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.product.price,
        total: item.total,
      })));

      for (const item of checkedItems) {
        await tx.update(products).set({
          stock: sql`${products.stock} - ${item.quantity}`,
          salesCount: sql`${products.salesCount} + ${item.quantity}`,
          updatedAt: now,
        }).where(eq(products.id, item.product.id));
      }
      return order;
    });

    return Response.json({ orderNumber: created.orderNumber, total: created.total }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Commande impossible";
    return Response.json({ error: message }, { status: 400 });
  }
}
