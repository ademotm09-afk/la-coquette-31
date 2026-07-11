import { auth } from "@/auth";

export async function isAdmin() {
  const session = await auth();
  const configuredEmail = (process.env.ADMIN_EMAIL || "admin@lacoquette.dz").toLowerCase();
  return session?.user?.email?.toLowerCase() === configuredEmail;
}

export async function unauthorizedResponse() {
  return Response.json({ error: "Non autorisé" }, { status: 401 });
}
