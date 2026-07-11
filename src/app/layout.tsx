import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Manrope, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["400", "500", "600", "700"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const arabic = Noto_Kufi_Arabic({ subsets: ["arabic"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://lacoquette.dz"),
  title: { default: "La Coquette — Mode féminine algérienne", template: "%s | La Coquette" },
  description: "Découvrez La Coquette, maison algérienne de mode féminine contemporaine. Livraison dans les 58 Wilayas et paiement à la livraison.",
  keywords: ["mode femme Algérie", "robes algériennes", "abaya Algérie", "La Coquette", "livraison 58 Wilayas"],
  openGraph: { title: "La Coquette", description: "L’élégance contemporaine, pensée à Alger.", siteName: "La Coquette", locale: "fr_DZ", type: "website" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 5, themeColor: "#FAF8F5", colorScheme: "light" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="fr" dir="ltr" suppressHydrationWarning><body className={`${manrope.variable} ${cormorant.variable} ${arabic.variable}`}>{children}</body></html>;
}
