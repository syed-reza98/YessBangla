import {
  getCatalogAction,
  suggestMedicinesAction,
  attachProductPricesAction,
} from "@/actions/catalog";

export type MedSuggestion = Awaited<ReturnType<typeof suggestMedicinesAction>>[number] & {
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
  stock: number;
  rx: boolean;
  emoji: string;
  image_url: string;
  medicine_image_url: string;
  manufacturer: string;
};

export async function suggestMedicineRows(term: string, limit: number): Promise<MedSuggestion[]> {
  const rows = await suggestMedicinesAction(term, limit);
  return rows as MedSuggestion[];
}

export type SharedMed = {
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
};

export async function attachPrices(items: SharedMed[]): Promise<SharedMed[]> {
  return attachProductPricesAction(items);
}

/** Kept for any leftover imports */
export async function getPublicCatalog() {
  return getCatalogAction();
}
