import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const data = await getAdminData();
  return <AdminDashboard initialProducts={data.products} initialOrders={data.orders} initialRates={data.rates} adminEmail={session.user.email || "admin@lacoquette.dz"} />;
}
