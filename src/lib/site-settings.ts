import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { asc } from "drizzle-orm";

export type SiteSettingsMap = {
  whatsappNumber: string;
  phoneNumber: string;
  instagramLink: string;
  facebookLink: string;
  emailAddress: string;
  googleMapsLink: string;
  businessHours: string;
  storeAddress: string;
};

const FALLBACK_SETTINGS: SiteSettingsMap = {
  whatsappNumber: "0541442571",
  phoneNumber: "0541442571",
  instagramLink: "https://www.instagram.com/lacoquette.brand",
  facebookLink: "https://www.facebook.com/share/1BRYR8uzsZ/?mibextid=wwXIfr",
  emailAddress: "web.automation.310@gmail.com",
  googleMapsLink: "https://www.google.com/maps/search/?api=1&query=La+Coquette+Alger",
  businessHours: "Lun - Sam: 10:00 - 20:00",
  storeAddress: "Alger, Algérie",
};

export const siteSettingKeys = Object.keys(FALLBACK_SETTINGS) as (keyof SiteSettingsMap)[];

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[char] || char));

export function sanitizeSiteSettingValue(value: unknown): string {
  return escapeHtml(String(value ?? "").trim().slice(0, 500));
}

export function normalizeSiteSettingKey(key: string): keyof SiteSettingsMap {
  if (key === "whatsappNumber") return "whatsappNumber";
  if (key === "phoneNumber") return "phoneNumber";
  if (key === "instagramLink") return "instagramLink";
  if (key === "facebookLink") return "facebookLink";
  if (key === "emailAddress") return "emailAddress";
  if (key === "googleMapsLink") return "googleMapsLink";
  if (key === "businessHours") return "businessHours";
  if (key === "storeAddress") return "storeAddress";
  return "whatsappNumber";
}

export async function getSiteSettingsMap(): Promise<SiteSettingsMap> {
  const map = { ...FALLBACK_SETTINGS };
  if (!db) return map;

  try {
    const rows = await db.select().from(siteSettings).orderBy(asc(siteSettings.key));
    for (const row of rows) {
      const key = normalizeSiteSettingKey(row.key);
      map[key] = row.value || map[key];
    }
  } catch {
    return map;
  }

  return map;
}

export async function upsertSiteSettings(values: Partial<SiteSettingsMap>) {
  if (!db) return FALLBACK_SETTINGS;

  const allowedEntries = Object.entries(values).filter(([key]) => siteSettingKeys.includes(key as keyof SiteSettingsMap));
  if (!allowedEntries.length) return FALLBACK_SETTINGS;

  const next = await Promise.all(
    allowedEntries.map(async ([key, value]) => {
      const settingKey = normalizeSiteSettingKey(key);
      const normalizedValue = sanitizeSiteSettingValue(value);
      const [row] = await db
        .insert(siteSettings)
        .values({ key: settingKey, value: normalizedValue })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: {
            value: normalizedValue,
            updatedAt: new Date(),
          },
        })
        .returning();
      return [settingKey, row?.value ?? normalizedValue] as const;
    }),
  );

  return { ...FALLBACK_SETTINGS, ...Object.fromEntries(next) } as SiteSettingsMap;
}

export function toWhatsAppLink(number: string) {
  const digits = String(number || "").replace(/\D/g, "");
  return `https://wa.me/213${digits.replace(/^0/, "")}?text=${encodeURIComponent("Bonjour La Coquette")}`;
}

export function toGoogleMapsEmbed(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query || FALLBACK_SETTINGS.storeAddress)}&z=14&output=embed`;
}
