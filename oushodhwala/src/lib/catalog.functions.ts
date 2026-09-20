// @ts-nocheck
"use server";

import { createServerFn } from "@tanstack/react-start";
import {
  getCatalogAction,
  searchProductsAction,
  getProductByIdAction,
} from "@/actions/catalog";

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  return getCatalogAction();
});

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator(
    (d: {
      q?: string;
      category?: string;
      sort?: string;
      rx?: boolean;
      maxPrice?: number;
      offset?: number;
      limit?: number;
    }) => d
  )
  .handler(async ({ data }) => searchProductsAction(data));

export const getProductById = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => getProductByIdAction(data.id));
