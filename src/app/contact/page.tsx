import type { Metadata } from "next";
import { ContactPageClient } from "./contact-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact | La Coquette",
  description: "Contactez La Coquette — Téléphone, WhatsApp, Email, réseaux sociaux. Nous sommes à votre écoute à Alger, Algérie.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
