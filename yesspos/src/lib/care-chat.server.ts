import { db } from "@/lib/db";
import {
  businessSettings,
  siteContent,
  categories,
  products,
  deliveryZones,
  coupons,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function money(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Public knowledge snapshot for the "Bazar Bari Care" chat box.
 * Only shop-public information is collected here (never customer or sales data).
 */
export async function buildCareKnowledge(): Promise<string> {
  const [settingsRows, contentRows, catRows, productRows, zoneRows, couponRows] = await Promise.all([
    db.select().from(businessSettings).limit(10),
    db.select().from(siteContent).limit(200),
    db.select({ nameBn: categories.nameBn, nameEn: categories.nameEn }).from(categories).limit(60),
    db
      .select({
        nameBn: products.nameBn,
        nameEn: products.nameEn,
        sellingPrice: products.sellingPrice,
        unit: products.unit,
        packSize: products.packSize,
        stock: products.stock,
      })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.stock))
      .limit(120),
    db
      .select({
        nameBn: deliveryZones.nameBn,
        nameEn: deliveryZones.nameEn,
        fee: deliveryZones.fee,
        minOrder: deliveryZones.minOrder,
        freeDeliveryAbove: deliveryZones.freeDeliveryAbove,
        etaMinutes: deliveryZones.etaMinutes,
      })
      .from(deliveryZones)
      .limit(40),
    db
      .select({
        code: coupons.code,
        discountType: coupons.discountType,
        discountValue: coupons.discountValue,
        minOrderAmount: coupons.minOrderAmount,
        maxDiscount: coupons.maxDiscount,
        validUntil: coupons.validUntil,
      })
      .from(coupons)
      .where(eq(coupons.isActive, true))
      .limit(20),
  ]);

  const settingsMap = new Map(settingsRows.map((r) => [r.key, r.value]));
  const shopName = settingsMap.get("shop_name") ?? "Bazar Bari";
  const currencySymbol = settingsMap.get("currency_symbol") ?? "৳";
  const address = settingsMap.get("address") ?? "n/a";
  const phone = settingsMap.get("phone") ?? "n/a";

  const lines: string[] = [];

  lines.push(
    `Shop: ${shopName} (বাজার বাড়ি). Currency: ${currencySymbol} (Bangladeshi Taka).`,
    `Address: ${address} | Phone: ${phone}`,
    "Bazar Bari is a part of Shondhaan, a sister concern of Yess Bangla Private Limited.",
  );

  lines.push(
    "",
    "WEBSITE PAGES CUSTOMERS CAN USE:",
    "- /product/<id> : product details page (price, pack size, stock, related items)",
    "- / : online grocery storefront (home page) (search, categories, cart, checkout with delivery slot, coupon, payment)",
    "- /my-orders : order history, reorder, cancel or reschedule an order (phone verification)",
    "- /track : live delivery tracking with rider name, phone and ETA",
    "- /my-account : customer account and loyalty points",
    "- /auth : staff login for the POS and dashboard",
    "- /privacy and /terms : legal pages",
    "Loyalty: customers earn 10 points per ৳100 purchase; after reaching 1000 points, every 10 points = ৳1 discount.",
    "Payments accepted: Cash, bKash, Nagad, Card and Bank transfer. Both online (home delivery) and in-shop (POS) buying is supported.",
  );

  if (zoneRows.length) {
    lines.push(
      "",
      "DELIVERY ZONES:",
      ...zoneRows.map(
        (z) =>
          `- ${z.nameBn || z.nameEn}: fee ৳${money(Number(z.fee ?? 0))}, min order ৳${money(Number(z.minOrder ?? 0))}` +
          (z.freeDeliveryAbove ? `, free delivery above ৳${money(Number(z.freeDeliveryAbove))}` : "") +
          `, ETA ~${z.etaMinutes} min`,
      ),
    );
  }

  if (catRows.length) {
    lines.push("", `CATEGORIES: ${catRows.map((c) => `${c.nameBn || c.nameEn}`).join(", ")}`);
  }

  if (productRows.length) {
    lines.push(
      "",
      "PRODUCTS (name — price — pack — availability):",
      ...productRows.map(
        (p) =>
          `- ${p.nameBn || p.nameEn} (${p.nameEn}) — ৳${money(Number(p.sellingPrice ?? 0))}/${p.unit}` +
          (p.packSize ? ` — ${p.packSize}` : "") +
          ` — ${Number(p.stock ?? 0) > 0 ? "in stock" : "out of stock"}`,
      ),
    );
  }

  if (couponRows.length) {
    lines.push(
      "",
      "ACTIVE COUPONS:",
      ...couponRows.map(
        (c) =>
          `- ${c.code}: ${c.discountType === "percentage" || c.discountType === "percent" ? `${c.discountValue}% off` : `৳${money(Number(c.discountValue ?? 0))} off`}` +
          `, min order ৳${money(Number(c.minOrderAmount ?? 0))}` +
          (c.maxDiscount ? `, max ৳${money(Number(c.maxDiscount))}` : "") +
          (c.validUntil ? `, valid till ${c.validUntil.toISOString().slice(0, 10)}` : ""),
      ),
    );
  }

  if (contentRows.length) {
    lines.push(
      "",
      "WEBSITE TEXTS (as published):",
      ...contentRows.slice(0, 120).map((r) => `- ${r.title || r.key}: ${(r.content || "").slice(0, 180)}`),
    );
  }

  return lines.join("\n");
}
