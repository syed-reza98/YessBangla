/**
 * Map Drizzle / MySQL rows to the legacy snake_case shapes the UI still expects.
 */

import type { InferSelectModel } from "drizzle-orm";
import type {
  products,
  categories,
  doctors,
  labTests,
  offers,
  profiles,
} from "@/db/schema";

type Product = InferSelectModel<typeof products>;
type Category = InferSelectModel<typeof categories>;
type Doctor = InferSelectModel<typeof doctors>;
type LabTest = InferSelectModel<typeof labTests>;
type Offer = InferSelectModel<typeof offers>;
type Profile = InferSelectModel<typeof profiles>;

export function productToLegacy(
  p: Product,
  categorySlug?: string | null
): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name,
    en: p.name,
    brand: p.manufacturer ?? "",
    generic: p.genericName ?? "",
    form: p.dosageForm ?? "Tablet",
    pack: "",
    price: Number(p.unitPrice),
    mrp: Number(p.mrp ?? p.unitPrice),
    category: categorySlug ?? p.categoryId ?? "",
    category_id: p.categoryId,
    rx: !!p.requiresPrescription,
    rating: 5,
    reviews: 0,
    emoji: "💊",
    description: p.description ?? "",
    description_en: "",
    stock: Number(p.stock) || 0,
    low_stock_threshold: Number(p.minStockAlert) || 10,
    image_url: p.imageUrl ?? "",
    medicine_image_url: "",
    manufacturer: p.manufacturer ?? "",
    strength: p.strength ?? "",
    base_name: (p.genericName || p.name || "").split(/\s+/)[0] ?? "",
    cost_price: Number(p.costPrice ?? 0),
    active: !!p.isActive,
    is_active: !!p.isActive,
    indications: "",
    indications_en: "",
    dosage: "",
    dosage_en: "",
    side_effects: "",
    side_effects_en: "",
    contraindications: "",
    contraindications_en: "",
    pregnancy: "",
    pregnancy_en: "",
    precautions: "",
    precautions_en: "",
    therapeutic_class: "",
    therapeutic_class_en: "",
    storage: "",
    storage_en: "",
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function categoryToLegacy(c: Category): Record<string, unknown> {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    bn: c.name,
    en: c.name,
    emoji: c.icon || "📦",
    icon: c.icon,
    sort_order: c.sortOrder,
    active: !!c.isActive,
    kind: "product",
    home_delivery: true,
    home_service: false,
    service_route: "",
    description: "",
    description_en: "",
    eta: "",
    eta_en: "",
    base_fee: 0,
    created_at: c.createdAt,
  };
}

export function doctorToLegacy(d: Doctor): Record<string, unknown> {
  const days = (d.availableDays as string[] | null) ?? [];
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const workDays = days
    .map((x) => dayMap[String(x).slice(0, 3)] ?? dayMap[String(x)])
    .filter((n): n is number => typeof n === "number");

  return {
    id: d.id,
    name: d.name,
    spec: d.specialty,
    specialty: d.specialty,
    degree: d.degrees ?? "",
    degrees: d.degrees ?? "",
    exp: d.hospital ?? "",
    hospital: d.hospital ?? "",
    fee: Number(d.consultationFee),
    consultation_fee: Number(d.consultationFee),
    emoji: "👨‍⚕️",
    photo_url: d.imageUrl ?? "",
    image_url: d.imageUrl ?? "",
    phone: "",
    whatsapp: "",
    video_url: "",
    online: true,
    work_start: "10:00",
    work_end: "22:00",
    slot_minutes: 30,
    work_days: workDays.length ? workDays : [0, 1, 2, 3, 4, 5, 6],
    sort_order: 0,
    active: !!d.isActive,
    rating: Number(d.rating ?? 5),
    created_at: d.createdAt,
  };
}

export function labTestToLegacy(t: LabTest): Record<string, unknown> {
  return {
    id: t.id,
    bn: t.name,
    en: t.name,
    name: t.name,
    price: Number(t.price),
    mrp: Number(t.price),
    grp: t.category,
    group: t.category,
    category: t.category,
    prep: t.turnaroundTime ?? "",
    turnaround_time: t.turnaroundTime ?? "",
    description: t.description ?? "",
    active: !!t.isActive,
    sort_order: 0,
    created_at: t.createdAt,
  };
}

export function offerToLegacy(o: Offer): Record<string, unknown> {
  return {
    id: o.id,
    code: o.code,
    title: o.title,
    subtitle: o.subtitle ?? "",
    emoji: "🎁",
    discount_pct: Number(o.discountPct ?? 0),
    max_discount: Number(o.maxDiscount ?? 0),
    min_order: Number(o.minOrder ?? 0),
    expires_at: o.expiresAt,
    active: !!o.isActive,
    created_at: o.createdAt,
  };
}

export function profileToLegacy(p: Profile): Record<string, unknown> {
  return {
    id: p.id,
    name: p.fullName ?? "",
    full_name: p.fullName ?? "",
    phone: p.phone ?? "",
    role: p.role,
    branch_id: p.branchId,
    avatar_url: p.avatarUrl,
    active: !!p.isActive,
    is_active: !!p.isActive,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

/** Map admin product form (legacy) → Drizzle insert/update values */
export function legacyProductToValues(p: Record<string, unknown>) {
  const id = String(p.id || crypto.randomUUID());
  return {
    id,
    name: String(p.name || p.en || "").slice(0, 255) || "Product",
    genericName: String(p.generic || "").slice(0, 255) || null,
    strength: String(p.strength || "").slice(0, 100) || null,
    dosageForm: String(p.form || "Tablet").slice(0, 100),
    manufacturer: String(p.manufacturer || p.brand || "").slice(0, 150) || null,
    categoryId: String(p.category_id || p.category || "").slice(0, 36) || null,
    unitPrice: Number(p.price || 0).toFixed(2),
    mrp: Number(p.mrp || p.price || 0).toFixed(2),
    costPrice: Number(p.cost_price || 0).toFixed(2),
    stock: Math.max(0, Number(p.stock) || 0),
    minStockAlert: Math.max(0, Number(p.low_stock_threshold) || 10),
    requiresPrescription: !!(p.rx ?? false),
    imageUrl: String(p.image_url || p.medicine_image_url || "") || null,
    description: String(p.description || "") || null,
    isActive: p.active === undefined ? true : !!p.active,
  };
}
