"use server";

import { and, asc, desc, eq, like, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  products,
  categories,
  offers,
  labTests,
  doctors,
  appSettings,
  genericInfo,
} from "@/db/schema";
import { expandQuery } from "@/lib/bn-search";
import {
  productToLegacy,
  categoryToLegacy,
  doctorToLegacy,
  labTestToLegacy,
  offerToLegacy,
} from "@/lib/legacy-rows";

async function categorySlugMap(): Promise<Map<string, string>> {
  const rows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  return new Map(rows.map((r) => [r.id, r.slug]));
}

export async function getCatalogAction() {
  const [prods, cats, offs, labs, docs, settings, slugMap] = await Promise.all([
    db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.stock), asc(products.name))
      .limit(120),
    db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder)),
    db
      .select()
      .from(offers)
      .where(eq(offers.isActive, true))
      .orderBy(desc(offers.createdAt)),
    db
      .select()
      .from(labTests)
      .where(eq(labTests.isActive, true))
      .orderBy(asc(labTests.name)),
    db
      .select()
      .from(doctors)
      .where(eq(doctors.isActive, true))
      .orderBy(asc(doctors.name)),
    db.select({ key: appSettings.key, value: appSettings.value }).from(appSettings),
    categorySlugMap(),
  ]);

  return {
    products: prods.map((p) => productToLegacy(p, slugMap.get(p.categoryId || "") || p.categoryId)),
    categories: cats.map(categoryToLegacy),
    offers: offs.map(offerToLegacy),
    labTests: labs.map(labTestToLegacy),
    doctors: docs.map(doctorToLegacy),
    settings,
  };
}

export async function searchProductsAction(data: {
  q?: string;
  category?: string;
  sort?: string;
  rx?: boolean;
  maxPrice?: number;
  offset?: number;
  limit?: number;
}) {
  const limit = Math.min(data.limit ?? 40, 60);
  const offset = data.offset ?? 0;
  const slugMap = await categorySlugMap();

  const conditions = [eq(products.isActive, true)];

  if (data.category && data.category !== "all") {
    const cat = await db
      .select({ id: categories.id })
      .from(categories)
      .where(or(eq(categories.slug, data.category), eq(categories.id, data.category)))
      .limit(1);
    if (cat[0]) conditions.push(eq(products.categoryId, cat[0].id));
  }
  if (data.rx) conditions.push(eq(products.requiresPrescription, true));
  if (data.maxPrice) {
    conditions.push(sql`CAST(${products.unitPrice} AS DECIMAL(12,2)) <= ${Number(data.maxPrice)}`);
  }

  const term = (data.q ?? "").trim().replace(/[%,()]/g, " ");
  if (term) {
    const variants = expandQuery(term);
    const likes = variants.flatMap((v) => {
      const pat = `%${v}%`;
      return [
        like(products.name, pat),
        like(products.genericName, pat),
        like(products.manufacturer, pat),
      ];
    });
    if (likes.length) conditions.push(or(...likes)!);
  }

  let orderBy;
  if (data.sort === "low") orderBy = asc(products.unitPrice);
  else if (data.sort === "high") orderBy = desc(products.unitPrice);
  else orderBy = asc(products.name);

  const where = and(...conditions);
  const [rows, countRow] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ c: sql<number>`count(*)` })
      .from(products)
      .where(where),
  ]);

  return {
    rows: rows.map((p) => productToLegacy(p, slugMap.get(p.categoryId || "") || p.categoryId)),
    count: Number(countRow[0]?.c ?? 0),
  };
}

export async function getProductByIdAction(id: string) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) return null;

  const slugMap = await categorySlugMap();
  const legacy = productToLegacy(row, slugMap.get(row.categoryId || "") || row.categoryId);

  const [related, variants, generic] = await Promise.all([
    row.categoryId
      ? db
          .select()
          .from(products)
          .where(
            and(
              eq(products.isActive, true),
              eq(products.categoryId, row.categoryId),
              ne(products.id, row.id)
            )
          )
          .limit(4)
      : Promise.resolve([]),
    row.genericName
      ? db
          .select()
          .from(products)
          .where(
            and(
              eq(products.isActive, true),
              eq(products.genericName, row.genericName),
              eq(products.manufacturer, row.manufacturer || "")
            )
          )
          .orderBy(asc(products.dosageForm))
          .limit(30)
      : Promise.resolve([]),
    row.genericName
      ? db
          .select()
          .from(genericInfo)
          .where(eq(genericInfo.genericName, row.genericName.trim()))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  return {
    row: legacy,
    related: related.map((p) => productToLegacy(p, slugMap.get(p.categoryId || "") || p.categoryId)),
    variants: variants.map((p) => ({
      id: p.id,
      name: p.name,
      en: p.name,
      strength: p.strength,
      form: p.dosageForm,
      pack: "",
      price: Number(p.unitPrice),
      mrp: Number(p.mrp ?? p.unitPrice),
      stock: p.stock,
      emoji: "💊",
      image_url: p.imageUrl,
      medicine_image_url: "",
    })),
    generic: generic
      ? {
          key: generic.genericName,
          name: generic.genericName,
          indication: generic.indication,
          dosage: generic.dosage,
          side_effects: generic.sideEffects,
          contraindications: generic.contraindications,
        }
      : null,
  };
}

export async function suggestMedicinesAction(term: string, limit = 20) {
  const clean = term.replace(/[%,()]/g, " ").trim();
  if (!clean) return [];
  const variants = Array.from(new Set([clean, ...expandQuery(clean)])).slice(0, 4);
  const likes = variants.flatMap((v) => {
    const pat = `%${v}%`;
    return [
      like(products.name, pat),
      like(products.genericName, pat),
      like(products.manufacturer, pat),
    ];
  });
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), or(...likes)!))
    .orderBy(desc(products.stock))
    .limit(Math.min(limit, 40));

  const slugMap = await categorySlugMap();
  const mapped = rows.map((p) => productToLegacy(p, slugMap.get(p.categoryId || "") || p.categoryId));
  const low = clean.toLowerCase();
  return mapped.sort((a, b) => {
    const na = String(a.name ?? "").toLowerCase();
    const ea = String(a.en ?? "").toLowerCase();
    const ga = String(a.generic ?? "").toLowerCase();
    const ba = String(a.brand ?? "").toLowerCase();
    const nb = String(b.name ?? "").toLowerCase();
    const eb = String(b.en ?? "").toLowerCase();
    const gb = String(b.generic ?? "").toLowerCase();
    const bb = String(b.brand ?? "").toLowerCase();
    const score = (name: string, en: string, generic: string, brand: string) => {
      if (name === low || en === low) return 0;
      if (name.startsWith(low) || en.startsWith(low)) return 1;
      if (brand.startsWith(low) || generic.startsWith(low)) return 2;
      return 3;
    };
    const sa = score(na, ea, ga, ba);
    const sb = score(nb, eb, gb, bb);
    if (sa !== sb) return sa - sb;
    return Number(b.stock || 0) - Number(a.stock || 0);
  }) as Array<Record<string, unknown>>;
}

export async function attachProductPricesAction(
  items: Array<{
    name: string;
    generic: string;
    strength: string;
    form: string;
    dose: string;
    duration: string;
    instruction: string;
    price?: number;
    productId?: string;
    inStock?: boolean;
  }>
) {
  const out = [];
  for (const it of items) {
    const term = (it.name || it.generic || "").replace(/[%,()]/g, " ").trim();
    if (!term) {
      out.push(it);
      continue;
    }
    const pat = `%${term}%`;
    const rows = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(
            like(products.name, pat),
            like(products.genericName, pat),
            like(products.manufacturer, pat)
          )!
        )
      )
      .orderBy(desc(products.stock))
      .limit(5);
    const num = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? []).join(" ");
    const best =
      rows.find((r) => it.strength && num(r.strength ?? "") === num(it.strength)) ?? rows[0];
    out.push(
      best
        ? {
            ...it,
            price: Number(best.unitPrice ?? 0),
            productId: String(best.id),
            inStock: Number(best.stock ?? 0) > 0,
          }
        : it
    );
  }
  return out;
}

export async function getSitemapCatalogAction() {
  const [cats, prods] = await Promise.all([
    db
      .select({ slug: categories.slug })
      .from(categories)
      .where(eq(categories.isActive, true))
      .limit(200),
    db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.stock))
      .limit(5000),
  ]);
  return { categories: cats, products: prods };
}

export async function getProductsStockAction(ids: string[]) {
  if (!ids.length) return [];
  const rows = await db
    .select({ id: products.id, name: products.name, stock: products.stock })
    .from(products)
    .where(sql`${products.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`);
  return rows;
}
