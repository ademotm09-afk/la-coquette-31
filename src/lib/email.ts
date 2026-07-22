import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "web.automation.310@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS || "";
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "web.automation.310@gmail.com";

function getTransporter() {
  if (!SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  wilaya: string;
  commune: string;
  items: { productName: string; size: string; color: string; quantity: number; unitPrice: number; total: number }[];
  deliveryType: string;
  shippingPrice: number;
  total: number;
  createdAt: Date;
};

export async function sendOrderNotification(order: OrderEmailData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("Email not configured — skipping notification. Set SMTP_PASS in .env");
    return false;
  }

  const formattedDate = order.createdAt.toLocaleDateString("fr-DZ", { year: "numeric", month: "long", day: "numeric" });
  const formattedTime = order.createdAt.toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" });
  const dtype = order.deliveryType === "office" ? "Bureau" : "Domicile";
  const money = (v: number) => `${new Intl.NumberFormat("fr-DZ").format(v)} DA`;

  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #eee">
        <strong>${escapeHtml(item.productName)}</strong><br>
        <span style="color:#998;font-size:11px">${escapeHtml(item.size)} · ${escapeHtml(item.color)}</span>
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:right">${money(item.unitPrice)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:right;font-weight:700">${money(item.total)}</td>
    </tr>
  `).join("");

  const html = `
  <!DOCTYPE html>
  <html lang="fr">
  <head><meta charset="utf-8"><title>Nouvelle commande ${escapeHtml(order.orderNumber)}</title></head>
  <body style="font-family:Arial,sans-serif;color:#3e2723;padding:40px;max-width:800px;margin:auto;line-height:1.5">
    <div style="display:flex;justify-content:space-between;border-bottom:2px solid #6f4e37;padding-bottom:24px">
      <div>
        <h1 style="font-family:Georgia,serif;font-size:36px;margin:0;color:#4a3027">La Coquette</h1>
        <p style="color:#88756b;font-size:12px">Maison de mode · Alger</p>
      </div>
      <div style="text-align:right">
        <span style="display:inline-block;background:#6f4e37;color:white;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700">NOUVELLE COMMANDE</span>
        <p style="margin-top:12px"><strong>${escapeHtml(order.orderNumber)}</strong><br><span style="color:#88756b;font-size:12px">${formattedDate} à ${formattedTime}</span></p>
      </div>
    </div>

    <div style="margin:30px 0;display:grid;grid-template-columns:1fr 1fr;gap:30px">
      <div>
        <strong style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7b675d">CLIENTE</strong>
        <p style="margin-top:8px"><strong>${escapeHtml(order.customerName)}</strong><br>${escapeHtml(order.phone)}</p>
      </div>
      <div>
        <strong style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7b675d">LIVRAISON</strong>
        <p style="margin-top:8px">${escapeHtml(order.address)}<br>${escapeHtml(order.commune)}, ${escapeHtml(order.wilaya)}<br><span style="color:#88756b;font-size:12px">${dtype}</span></p>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left;padding:10px 14px;border-bottom:2px solid #6f4e37;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7b675d">Produit</th>
          <th style="text-align:center;padding:10px 14px;border-bottom:2px solid #6f4e37;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7b675d">Qté</th>
          <th style="text-align:right;padding:10px 14px;border-bottom:2px solid #6f4e37;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7b675d">Prix</th>
          <th style="text-align:right;padding:10px 14px;border-bottom:2px solid #6f4e37;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7b675d">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="text-align:right;margin-top:24px;padding-top:16px;border-top:2px solid #6f4e37">
      <p style="margin:4px 0;font-size:13px;color:#88756b">Sous-total : <strong>${money(order.items.reduce((s, i) => s + i.total, 0))}</strong></p>
      <p style="margin:4px 0;font-size:13px;color:#88756b">Livraison (${dtype}) : <strong>${money(order.shippingPrice)}</strong></p>
      <p style="margin:8px 0 0;font-size:20px"><strong>TOTAL : ${money(order.total)}</strong></p>
    </div>
  </body>
  </html>`;

  try {
    await transporter.sendMail({
      from: `"La Coquette" <${SMTP_USER}>`,
      to: NOTIFICATION_EMAIL,
      subject: `🛍 Nouvelle commande ${order.orderNumber} — ${order.customerName}`,
      html,
    });
    console.log(`Order notification sent for ${order.orderNumber}`);
    return true;
  } catch (error) {
    console.error("Failed to send order notification:", error);
    return false;
  }
}
