import { getSiteSettingsMap, upsertSiteSettings, type SiteSettingsMap } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSiteSettingsMap();
    return Response.json(settings);
  } catch {
    return Response.json({
      whatsappNumber: "0541442571",
      phoneNumber: "0541442571",
      instagramLink: "https://www.instagram.com/lacoquette.brand",
      facebookLink: "https://www.facebook.com/share/1BRYR8uzsZ/?mibextid=wwXIfr",
      emailAddress: "web.automation.310@gmail.com",
      googleMapsLink: "https://www.google.com/maps/search/?api=1&query=La+Coquette+Alger",
      businessHours: "Lun - Sam: 10:00 - 20:00",
      storeAddress: "Alger, Algérie",
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const allowedKeys: (keyof SiteSettingsMap)[] = [
      "whatsappNumber", "phoneNumber", "instagramLink", "facebookLink",
      "emailAddress", "googleMapsLink", "businessHours", "storeAddress",
    ];

    const updates: Partial<SiteSettingsMap> = {};
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updates[key] = String(body[key]).trim().slice(0, 500);
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "Aucune donnée fournie" }, { status: 400 });
    }

    const result = await upsertSiteSettings(updates);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
