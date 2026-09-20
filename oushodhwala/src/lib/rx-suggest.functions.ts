"use server";

import { suggestMedicineRows } from "@/lib/rx-suggest.server";

export async function suggestMedicines(
  input: { q: string; limit?: number } | { data: { q: string; limit?: number } }
) {
  const data = "data" in input ? input.data : input;
  const rows = await suggestMedicineRows(
    data.q ?? "",
    Math.min(data.limit ?? 8, 20)
  );
  return { rows };
}
