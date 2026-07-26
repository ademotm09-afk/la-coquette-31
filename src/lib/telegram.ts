const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WEBSITE_NAME = "LA COQUETTE";

type TelegramOrderItem = {
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type TelegramOrderData = {
  orderNumber: string;
  customerName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  deliveryType: string;
  items: TelegramOrderItem[];
  subtotal: number;
  shippingPrice: number;
  total: number;
  note?: string | null;
  createdAt: Date;
};

function money(v: number): string {
  return `${new Intl.NumberFormat("fr-DZ").format(v)} DZD`;
}

/**
 * Send a Telegram notification to the store owner when a new order is placed.
 *
 * Server-side only — reads credentials from process.env so the bot token is
 * never exposed to the client. Returns true on success, false on failure.
 * Errors are logged but never thrown, so callers can fire-and-forget without
 * risking the main request flow (the order is already saved in the database).
 */
export async function sendTelegramNotification(data: TelegramOrderData): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn(
      "Telegram not configured — skipping notification. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env",
    );
    return false;
  }

  const formattedDate = data.createdAt.toLocaleString("fr-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dtype = data.deliveryType === "office" ? "Bureau" : "Domicile";

  const productList = data.items
    .map((item) => {
      const lines = [
        `📦 المنتج: ${item.productName}`,
        `🔢 الكمية: ${item.quantity}`,
        `💰 السعر: ${money(item.total)}`,
      ];
      if (item.size) lines.push(`📏 المقاس: ${item.size}`);
      if (item.color) lines.push(`🎨 اللون: ${item.color}`);
      return lines.join("\n");
    })
    .join("\n\n");

  const fullAddress = [data.address, data.commune, data.wilaya].filter(Boolean).join("، ");

  const text = [
    "🛍️ طلب جديد LA COQUETTE",
    "",
    `👤 العميل: ${data.customerName}`,
    `📞 الهاتف: ${data.phone}`,
    `📍 الولاية: ${data.wilaya}`,
    `🏠 العنوان: ${fullAddress}`,
    `🚚 التوصيل: ${dtype}`,
    "",
    productList,
    "",
    `💰 المجموع الفرعي: ${money(data.subtotal)}`,
    `🚚 التوصيل: ${money(data.shippingPrice)}`,
    `💰 الإجمالي: ${money(data.total)}`,
    `🆔 رقم الطلب: ${data.orderNumber}`,
  ];

  if (data.note && data.note.trim()) {
    text.push(`📝 ملاحظات: ${data.note.trim()}`);
  }

  text.push("", `⏰ التاريخ: ${formattedDate}`, `🌐 الموقع: ${WEBSITE_NAME}`);

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text.join("\n"),
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Telegram API error (${response.status}):`, errorBody);
      return false;
    }

    const result = (await response.json()) as { ok: boolean };
    if (!result.ok) {
      console.error("Telegram API returned ok=false:", JSON.stringify(result));
      return false;
    }

    console.log(`Telegram notification sent for order ${data.orderNumber}`);
    return true;
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
    return false;
  }
}
