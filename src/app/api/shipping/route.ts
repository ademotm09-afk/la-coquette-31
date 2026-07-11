import { db } from "@/db";
import { shippingRates } from "@/db/schema";
import { isAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const rates = await db.select().from(shippingRates).orderBy(shippingRates.code);
  return Response.json(rates);
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorizedResponse();
  try {
    const body = await request.json();
    const code = Number(body.code);
    const name = String(body.name || "").trim();
    const homePrice = Number(body.homePrice);
    const deskPrice = Number(body.deskPrice);
    const estimatedDays = Number(body.estimatedDays) || 3;

    if (!code || code < 1 || code > 58 || !name) {
      return Response.json({ error: "Code (1-58) et nom requis" }, { status: 400 });
    }
    if (homePrice < 0 || deskPrice < 0) {
      return Response.json({ error: "Prix invalide" }, { status: 400 });
    }

    const [existing] = await db.select().from(shippingRates).where(eq(shippingRates.code, code)).limit(1);
    if (existing) return Response.json({ error: "Cette Wilaya existe déjà" }, { status: 409 });

    const [created] = await db.insert(shippingRates).values({ code, name, homePrice, deskPrice, estimatedDays }).returning();
    return Response.json(created, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Création impossible" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return unauthorizedResponse();
  const body = await request.json();
  const code = Number(body.code);
  const homePrice = Number(body.homePrice);
  const deskPrice = Number(body.deskPrice);
  const estimatedDays = body.estimatedDays !== undefined ? Number(body.estimatedDays) : undefined;
  const active = body.active !== undefined ? Boolean(body.active) : undefined;

  if (!code || homePrice < 0 || deskPrice < 0) return Response.json({ error: "Tarif invalide" }, { status: 400 });

  const updateData: Record<string, unknown> = { homePrice, deskPrice, updatedAt: new Date() };
  if (estimatedDays !== undefined) updateData.estimatedDays = estimatedDays;
  if (active !== undefined) updateData.active = active;

  const [updated] = await db.update(shippingRates).set(updateData).where(eq(shippingRates.code, code)).returning();
  return Response.json(updated || { error: "Wilaya introuvable" }, { status: updated ? 200 : 404 });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return unauthorizedResponse();
  try {
    const body = await request.json();
    const code = Number(body.code);
    if (!code) return Response.json({ error: "Code requis" }, { status: 400 });
    const [deleted] = await db.delete(shippingRates).where(eq(shippingRates.code, code)).returning({ code: shippingRates.code });
    return Response.json(deleted || { error: "Wilaya introuvable" }, { status: deleted ? 200 : 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Suppression impossible" }, { status: 400 });
  }
}
