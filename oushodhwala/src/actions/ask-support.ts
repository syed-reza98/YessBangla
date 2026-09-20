"use server";

import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { and, desc, eq, like, or } from "drizzle-orm";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { checkIpRateLimit, getClientIp } from "@/lib/ip-rate-limit";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  products,
  categories,
  labTests,
  doctors,
  orders,
  deliveries,
  offers,
} from "@/db/schema";
import { getMyLoyaltyAction } from "@/actions/loyalty";
import { listMyOrdersAction } from "@/actions/orders-query";
import {
  addSupportMessageAction,
  isSupportAgentLiveAction,
  listSupportMessagesAction,
} from "@/actions/support";

const Input = z.object({
  conversationId: z.string().uuid(),
  lang: z.enum(["bn", "en"]).default("bn"),
});

const SYSTEM_BN = `তুমি "ঔষধওয়ালা" (Oushodhwala) অনলাইন ফার্মেসির অফিসিয়াল AI সহকারী। নাম: "ঔষধওয়ালাকে বলুন"।

তোমার কাজ:
- ঔষধ, স্বাস্থ্য পণ্য, দাম, স্টক, ল্যাব টেস্ট, হোম ডায়াগনস্টিক, হোম সার্ভিস, ডাক্তার অ্যাপয়েন্টমেন্ট, অর্ডার স্ট্যাটাস, ডেলিভারি, রিটার্ন/রিফান্ড, লয়ালটি পয়েন্ট ও পেমেন্ট (bKash, Nagad, Card, COD) সম্পর্কে সঠিক তথ্য দেওয়া।
- উত্তর দেওয়ার আগে সবসময় টুল ব্যবহার করে ডাটাবেজ থেকে বাস্তব তথ্য নাও। অনুমান করে দাম, স্টক বা অর্ডার তথ্য বানিয়ে বলবে না।
- পণ্যের কথা বললে নাম, শক্তি/মাত্রা, প্যাক, দাম (৳), স্টক ও প্রেসক্রিপশন লাগবে কিনা জানাও।
- হটলাইন ১৬৭০০ (২৪/৭)। ঢাকায় এক্সপ্রেস ডেলিভারি ৩০–৬০ মিনিট, সারাদেশে ২৪–৭২ ঘণ্টা।

নিরাপত্তা: তুমি ডাক্তার নও। ডোজ/চিকিৎসা পরামর্শে সবসময় রেজিস্টার্ড ডাক্তার বা আমাদের ডাক্তার কনসালটেশন সেবার পরামর্শ দাও। প্রেসক্রিপশন ঔষধ প্রেসক্রিপশন ছাড়া দেওয়া যায় না।

স্টাইল: সংক্ষিপ্ত, ভদ্র, মার্কডাউন বুলেট। উত্তর ২০০ শব্দের মধ্যে রাখো।

ভাষা (সর্বোচ্চ অগ্রাধিকার): উত্তর সবসময় **বাংলায়** দাও — গ্রাহক ইংরেজিতে বা অন্য ভাষায় প্রশ্ন করলেও, এবং কথোপকথনের আগের বার্তা অন্য ভাষায় থাকলেও। শুধু ঔষধ/ব্র্যান্ডের ইংরেজি নাম মূল রূপে রাখা যাবে।`;

const SYSTEM_EN =
  SYSTEM_BN.replace(/\n\nভাষা \(সর্বোচ্চ অগ্রাধিকার\):[\s\S]*$/, "") +
  "\n\nLANGUAGE (HIGHEST PRIORITY): Always answer in **English**, even if the customer writes in Bengali or another language, and even if earlier messages in this conversation are in another language. Bengali brand names may be kept as-is.";

const LANG_NOTE = {
  bn: "[সিস্টেম নির্দেশ: গ্রাহক এখন বাংলা ভাষা নির্বাচন করেছেন — এই উত্তরটি অবশ্যই বাংলায় দাও।]",
  en: "[System instruction: the customer has selected English — you must answer this message in English.]",
} as const;

type Sb = { from: (t: string) => any; rpc: (f: string, a?: unknown) => any };

function buildTools(_supabase?: Sb) {
  return {
    search_products: tool({
      description: "ঔষধ বা স্বাস্থ্য পণ্য খুঁজে দাম, স্টক ও প্যাক জানার জন্য।",
      inputSchema: z.object({ query: z.string().describe("ঔষধ/জেনেরিক/ব্র্যান্ডের নাম") }),
      execute: async ({ query }) => {
        const q = `%${query.trim().replace(/[%,]/g, " ")}%`;
        const rows = await db
          .select({
            id: products.id,
            name: products.name,
            generic: products.genericName,
            strength: products.strength,
            form: products.dosageForm,
            price: products.unitPrice,
            mrp: products.mrp,
            stock: products.stock,
            rx: products.requiresPrescription,
            manufacturer: products.manufacturer,
          })
          .from(products)
          .where(
            and(
              eq(products.isActive, true),
              or(
                like(products.name, q),
                like(products.genericName, q),
                like(products.manufacturer, q)
              )
            )
          )
          .orderBy(desc(products.stock))
          .limit(8);
        return {
          results: rows.map((r) => ({
            ...r,
            en: r.name,
            brand: r.manufacturer,
            pack: r.form,
            price: Number(r.price),
            mrp: Number(r.mrp ?? 0),
          })),
        };
      },
    }),
    product_details: tool({
      description: "একটি নির্দিষ্ট পণ্যের বিস্তারিত (নির্দেশনা, মাত্রা, পার্শ্বপ্রতিক্রিয়া, সতর্কতা)।",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => {
        const [row] = await db
          .select()
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);
        if (!row) return { error: "not found" };
        return {
          id: row.id,
          name: row.name,
          en: row.name,
          generic: row.genericName,
          strength: row.strength,
          form: row.dosageForm,
          pack: row.dosageForm,
          price: Number(row.unitPrice),
          stock: row.stock,
          rx: row.requiresPrescription,
          manufacturer: row.manufacturer,
          indications: row.description,
        };
      },
    }),
    list_categories: tool({
      description: "সব ক্যাটাগরি ও হোম সার্ভিস/হোম ডেলিভারি সুবিধা, ফি ও ETA।",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select()
          .from(categories)
          .where(eq(categories.isActive, true))
          .orderBy(categories.sortOrder)
          .limit(60);
        return {
          categories: rows.map((c) => ({
            slug: c.slug,
            bn: c.name,
            en: c.name,
            kind: "product",
            home_delivery: true,
            home_service: false,
            eta: "30-60 min",
            base_fee: 0,
          })),
        };
      },
    }),
    lab_tests: tool({
      description: "ল্যাব টেস্টের নাম, দাম ও প্রস্তুতি।",
      inputSchema: z.object({ query: z.string().default("") }),
      execute: async ({ query }) => {
        const q = query.trim();
        const rows = q
          ? await db
              .select()
              .from(labTests)
              .where(
                and(
                  eq(labTests.isActive, true),
                  or(like(labTests.name, `%${q}%`), like(labTests.category, `%${q}%`))
                )
              )
              .limit(10)
          : await db
              .select()
              .from(labTests)
              .where(eq(labTests.isActive, true))
              .limit(10);
        return {
          tests: rows.map((t) => ({
            id: t.id,
            bn: t.name,
            en: t.name,
            price: Number(t.price),
            mrp: Number(t.price),
            grp: t.category,
            prep: t.turnaroundTime,
          })),
        };
      },
    }),
    doctors: tool({
      description: "ডাক্তার তালিকা, স্পেশালিটি ও ফি।",
      inputSchema: z.object({ spec: z.string().default("") }),
      execute: async ({ spec }) => {
        const s = spec.trim();
        const rows = s
          ? await db
              .select()
              .from(doctors)
              .where(and(eq(doctors.isActive, true), like(doctors.specialty, `%${s}%`)))
              .limit(10)
          : await db.select().from(doctors).where(eq(doctors.isActive, true)).limit(10);
        return {
          doctors: rows.map((d) => ({
            id: d.id,
            name: d.name,
            spec: d.specialty,
            degree: d.degrees,
            exp: d.hospital,
            fee: Number(d.consultationFee),
            online: true,
          })),
        };
      },
    }),
    my_orders: tool({
      description: "সাইন-ইন করা গ্রাহকের সাম্প্রতিক অর্ডার ও স্ট্যাটাস।",
      inputSchema: z.object({}),
      execute: async () => {
        const res = await listMyOrdersAction();
        if (!res.ok) return { orders: [], error: res.error };
        const list = (res.orders as Array<Record<string, unknown>>).slice(0, 5).map((o) => ({
          order_no: o.order_no,
          status: o.status,
          total: o.total,
          payment_method: o.payment_method,
          payment_status: o.payment_status,
          created_at: o.created_at,
          address: o.delivery_address,
        }));
        return { orders: list };
      },
    }),
    track_order: tool({
      description: "অর্ডার নম্বর দিয়ে ডেলিভারি ট্র্যাকিং তথ্য।",
      inputSchema: z.object({ orderNo: z.string() }),
      execute: async ({ orderNo }) => {
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.orderNumber, orderNo.trim()))
          .limit(1);
        if (!order) return { error: "order not found" };
        const [d] = await db
          .select()
          .from(deliveries)
          .where(eq(deliveries.orderId, order.id))
          .limit(1);
        return {
          order: {
            id: order.id,
            order_no: order.orderNumber,
            status: order.status,
            total: Number(order.total),
            created_at: order.createdAt,
          },
          delivery: d
            ? {
                status: d.status,
                eta_minutes: d.etaMinutes,
                assigned_at: d.createdAt,
              }
            : null,
        };
      },
    }),
    my_loyalty: tool({
      description: "গ্রাহকের লয়ালটি পয়েন্ট ব্যালেন্স ও টিয়ার।",
      inputSchema: z.object({}),
      execute: async () => {
        const res = await getMyLoyaltyAction();
        if (!res.ok) return { balance: 0, error: res.error };
        return { balance: res.balance };
      },
    }),
    active_offers: tool({
      description: "চলমান অফার ও কুপন কোড।",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select()
          .from(offers)
          .where(eq(offers.isActive, true))
          .limit(10);
        return {
          offers: rows.map((o) => ({
            code: o.code,
            title: o.title,
            discount_pct: Number(o.discountPct ?? 0),
            expires_at: o.expiresAt,
          })),
        };
      },
    }),
  };
}

/** AI উত্তর তৈরি — কাস্টমার কেয়ার প্রতিনিধি সক্রিয় থাকলে AI চুপ থাকে */
export async function askSupportAIAction(raw: unknown) {
  const data = Input.parse(raw);
  const liveCheck = await isSupportAgentLiveAction({
    conversationId: data.conversationId,
  });
  if (liveCheck.ok && liveCheck.live) {
    return { skipped: true as const, reason: "agent_active" };
  }

  const hist = await listSupportMessagesAction({
    conversationId: data.conversationId,
  });
  if (!hist.ok) throw new Error(hist.error);
  const rows = (hist.messages ?? []) as Array<{ sender: string; body: string }>;

  const history = rows.slice(-16).map((m) => ({
    role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
    content:
      m.sender === "agent" ? `[কাস্টমার কেয়ার প্রতিনিধি] ${m.body}` : m.body,
  }));

  if (history.length === 0) return { skipped: true as const, reason: "empty" };

  const last = history[history.length - 1]!;
  const messages =
    last.role === "user"
      ? [
          ...history.slice(0, -1),
          { ...last, content: `${last.content}\n\n${LANG_NOTE[data.lang]}` },
        ]
      : [...history, { role: "user" as const, content: LANG_NOTE[data.lang] }];

  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI সেবা কনফিগার করা নেই।");

  const gateway = createLovableAiGatewayProvider(key);

  let text = "";
  try {
    const result = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      system: data.lang === "en" ? SYSTEM_EN : SYSTEM_BN,
      messages,
      tools: buildTools(),
      stopWhen: stepCountIs(50),
      providerOptions: { lovable: { reasoningEffort: "none" } },
    });
    text = result.text.trim();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("429"))
      throw new Error("অনেক বেশি অনুরোধ — কিছুক্ষণ পরে চেষ্টা করুন।");
    if (msg.includes("402")) throw new Error("AI ক্রেডিট শেষ হয়ে গেছে।");
    throw new Error("AI উত্তর তৈরি করা যায়নি: " + msg);
  }

  if (!text)
    text =
      data.lang === "en"
        ? "Sorry, I couldn't find that."
        : "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না।";

  const liveNow = await isSupportAgentLiveAction({
    conversationId: data.conversationId,
  });
  if (liveNow.ok && liveNow.live) {
    return { skipped: true as const, reason: "agent_active" };
  }

  const added = await addSupportMessageAction({
    conversationId: data.conversationId,
    sender: "ai",
    body: text,
  });
  if (!added.ok) throw new Error(added.error);

  return { skipped: false as const, text };
}

const GuestInput = z.object({
  lang: z.enum(["bn", "en"]).default("bn"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .min(1)
    .max(16),
  /** Honeypot — bots fill this; humans leave empty */
  website: z.string().max(200).optional().default(""),
});

const GUEST_NOTE = {
  bn: "\n\nগুরুত্বপূর্ণ: এই গ্রাহক লগইন করেননি। ব্যক্তিগত তথ্য (অর্ডার, লয়ালটি পয়েন্ট, প্রেসক্রিপশন ইতিহাস) দেখা যাবে না — এসব চাইলে ভদ্রভাবে লগইন করতে বলো। অন্য সব সাধারণ তথ্য স্বাভাবিকভাবে দাও।",
  en: "\n\nIMPORTANT: this customer is NOT signed in. Personal data (orders, loyalty points, prescription history) is unavailable — politely ask them to sign in for those. Answer all other general questions normally.",
} as const;

export async function askSupportGuestAction(raw: unknown) {
  const data = GuestInput.parse(raw);
  if (data.website) {
    throw new Error(data.lang === "en" ? "Blocked." : "ব্লক করা হয়েছে।");
  }
  let ip = "unknown";
  try {
    ip = getClientIp(await headers());
  } catch {
    ip = "unknown";
  }
  const limited = checkIpRateLimit(`ask-guest:${ip}`, 20, 15 * 60 * 1000);
  if (!limited.ok) {
    throw new Error(
      data.lang === "en"
        ? `Too many requests — try again in ${limited.retryAfterSec}s.`
        : `অনেক বেশি অনুরোধ — ${limited.retryAfterSec} সেকেন্ড পরে চেষ্টা করুন।`
    );
  }

  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI সেবা কনফিগার করা নেই।");
  const gateway = createLovableAiGatewayProvider(key);

  const all = buildTools();
  const publicTools = {
    search_products: all.search_products,
    product_details: all.product_details,
    list_categories: all.list_categories,
    lab_tests: all.lab_tests,
    doctors: all.doctors,
    active_offers: all.active_offers,
  };

  const history = data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const last = history[history.length - 1]!;
  const messages =
    last.role === "user"
      ? [
          ...history.slice(0, -1),
          { ...last, content: `${last.content}\n\n${LANG_NOTE[data.lang]}` },
        ]
      : [...history, { role: "user" as const, content: LANG_NOTE[data.lang] }];

  try {
    const result = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      system: (data.lang === "en" ? SYSTEM_EN : SYSTEM_BN) + GUEST_NOTE[data.lang],
      messages,
      tools: publicTools,
      stopWhen: stepCountIs(50),
      providerOptions: { lovable: { reasoningEffort: "none" } },
    });
    const text = result.text.trim();
    return {
      text:
        text ||
        (data.lang === "en"
          ? "Sorry, I couldn't find that."
          : "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না।"),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("429"))
      throw new Error("অনেক বেশি অনুরোধ — কিছুক্ষণ পরে চেষ্টা করুন।");
    if (msg.includes("402")) throw new Error("AI ক্রেডিট শেষ হয়ে গেছে।");
    throw new Error("AI উত্তর তৈরি করা যায়নি: " + msg);
  }
}
