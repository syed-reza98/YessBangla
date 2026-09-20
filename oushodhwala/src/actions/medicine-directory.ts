"use server";

import { and, asc, eq, like, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { medicineDirectory, genericInfo } from "@/db/schema";
import { expandQuery } from "@/lib/bn-search";

export type DirectoryRow = {
  id: string;
  name: string;
  en: string;
  brand: string;
  generic: string;
  strength: string;
  form: string;
  pack: string;
  price: number;
  mrp: number;
  rx: boolean;
  company: string;
  grp_bn: string;
  grp_en: string;
};

function mapDir(r: typeof medicineDirectory.$inferSelect): DirectoryRow {
  return {
    id: r.id,
    name: r.name,
    en: r.en,
    brand: r.brand ?? "",
    generic: r.generic ?? "",
    strength: r.strength ?? "",
    form: r.form ?? "",
    pack: r.pack ?? "",
    price: Number(r.price),
    mrp: Number(r.mrp ?? r.price),
    rx: !!r.rx,
    company: r.company ?? "",
    grp_bn: r.grpBn ?? "",
    grp_en: r.grpEn ?? "",
  };
}

export async function listMedicineDirectoryAction(data: {
  q?: string;
  group?: string;
  company?: string;
  sort?: string;
  offset?: number;
  limit?: number;
}) {
  const limit = Math.min(Math.max(data.limit ?? 50, 1), 200);
  const offset = Math.max(data.offset ?? 0, 0);
  const conditions = [];

  if (data.group) conditions.push(eq(medicineDirectory.grpEn, data.group));
  if (data.company) conditions.push(eq(medicineDirectory.company, data.company));

  const term = (data.q ?? "").trim().replace(/[%,()]/g, " ");
  if (term) {
    const variants = Array.from(new Set([term, ...expandQuery(term)])).slice(0, 4);
    const likes = variants.flatMap((v) => {
      const pat = `%${v}%`;
      return [
        like(medicineDirectory.name, pat),
        like(medicineDirectory.en, pat),
        like(medicineDirectory.brand, pat),
        like(medicineDirectory.generic, pat),
      ];
    });
    conditions.push(or(...likes)!);
  }

  const where = conditions.length ? and(...conditions) : undefined;
  let orderBy = asc(medicineDirectory.en);
  if (data.sort === "company") orderBy = asc(medicineDirectory.company);
  else if (data.sort === "generic") orderBy = asc(medicineDirectory.generic);
  else if (data.sort === "group") orderBy = asc(medicineDirectory.grpEn);

  const [rows, countRow] = await Promise.all([
    db
      .select()
      .from(medicineDirectory)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ c: sql<number>`count(*)` }).from(medicineDirectory).where(where),
  ]);

  return { rows: rows.map(mapDir), count: Number(countRow[0]?.c ?? 0) };
}

export async function getMedicineBrandDetailAction(id: string) {
  const [row] = await db
    .select()
    .from(medicineDirectory)
    .where(eq(medicineDirectory.id, id))
    .limit(1);
  if (!row) return null;
  const med = mapDir(row);
  const genericKey = (med.generic || "").split("+")[0]?.split(",")[0]?.trim() ?? "";

  const [alternatives, genRow, moreFromCompany] = await Promise.all([
    med.generic
      ? db
          .select()
          .from(medicineDirectory)
          .where(and(eq(medicineDirectory.generic, med.generic), ne(medicineDirectory.id, med.id)))
          .orderBy(asc(medicineDirectory.price))
          .limit(40)
      : Promise.resolve([]),
    genericKey
      ? db
          .select()
          .from(genericInfo)
          .where(like(genericInfo.genericName, genericKey))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    med.company
      ? db
          .select()
          .from(medicineDirectory)
          .where(and(eq(medicineDirectory.company, med.company), ne(medicineDirectory.id, med.id)))
          .orderBy(asc(medicineDirectory.en))
          .limit(12)
      : Promise.resolve([]),
  ]);

  return {
    medicine: med,
    genericInfo: genRow
      ? {
          name: genRow.genericName,
          indication: genRow.indication,
          dosage: genRow.dosage,
          side_effects: genRow.sideEffects,
          contraindications: genRow.contraindications,
        }
      : null,
    alternatives: alternatives.map(mapDir),
    moreFromCompany: moreFromCompany.map(mapDir),
  };
}
