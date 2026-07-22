import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminData } from "@/lib/data";
import { getSiteSettingsMap } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const [data, siteSettings] = await Promise.all([getAdminData(), getSiteSettingsMap()]);
  return <AdminDashboard initialProducts={data.products} initialOrders={data.orders} initialRates={data.rates} initialSettings={siteSettings} adminEmail={session.user.email || "admin@lacoquette.dz"} />;
}
