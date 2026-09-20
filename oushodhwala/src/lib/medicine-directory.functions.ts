"use server";

import { createServerFn } from "@tanstack/react-start";
import {
  listMedicineDirectoryAction,
  getMedicineBrandDetailAction,
  type DirectoryRow,
} from "@/actions/medicine-directory";
import { getMedicineDirectoryFacetsAction } from "@/actions/admin-ops";

export type { DirectoryRow };

export const listMedicineDirectory = createServerFn({ method: "GET" })
  .inputValidator(
    (d: {
      q?: string;
      group?: string;
      company?: string;
      sort?: string;
      offset?: number;
      limit?: number;
    }) => d
  )
  .handler(async ({ data }) => listMedicineDirectoryAction(data));

export const getMedicineBrandDetail = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => getMedicineBrandDetailAction(data.id));

export const getMedicineFacets = createServerFn({ method: "GET" }).handler(async () => {
  const facets = await getMedicineDirectoryFacetsAction();
  return {
    groups: (facets.generics || []).map((g) => ({ value: g, cnt: 1 })),
    companies: (facets.manufacturers || []).map((m) => ({ value: m, cnt: 1 })),
  };
});
