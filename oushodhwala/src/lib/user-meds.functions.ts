"use server";

import {
  getUserMedicinesAction,
  toggleFavoriteAction,
  addRecentMedicineAction,
  removeFavoritesAction,
  removeRecentMedicinesAction,
} from "@/actions/account";

/** Thin Action wrappers preserving legacy `{ data }` call shapes where needed */

export async function getUserMedicines() {
  const res = await getUserMedicinesAction();
  if (!res.ok) throw new Error(res.error);
  return { favorites: res.favorites, recent: res.recent };
}

export async function toggleUserFavorite(input: { productId: string } | { data: { productId: string } }) {
  const productId = "data" in input ? input.data.productId : input.productId;
  const res = await toggleFavoriteAction({ productId });
  if (!res.ok) throw new Error(res.error);
  return { favorite: res.favorited };
}

export async function addUserRecent(input: { productId: string } | { data: { productId: string } }) {
  const productId = "data" in input ? input.data.productId : input.productId;
  const res = await addRecentMedicineAction({ productId });
  if (!res.ok) throw new Error(res.error);
  return { success: true };
}

export async function syncUserMedicines(
  input:
    | { favIds: string[]; recentIds: string[] }
    | { data: { favIds: string[]; recentIds: string[] } }
) {
  const payload = "data" in input ? input.data : input;
  const current = await getUserMedicinesAction();
  if (!current.ok) throw new Error(current.error);
  const haveFav = new Set(
    (current.favorites as Array<{ id: string }>).map((f) => f.id)
  );
  for (const id of payload.favIds) {
    if (!haveFav.has(id)) {
      await toggleFavoriteAction({ productId: id }).catch(() => undefined);
    }
  }
  for (const id of payload.recentIds) {
    await addRecentMedicineAction({ productId: id }).catch(() => undefined);
  }
  const res = await getUserMedicinesAction();
  if (!res.ok) throw new Error(res.error);
  return { favorites: res.favorites, recent: res.recent };
}

export async function bulkRemoveUserFavorites(
  input: { ids: string[] } | { data: { ids: string[] } }
) {
  const ids = "data" in input ? input.data.ids : input.ids;
  const res = await removeFavoritesAction({ productIds: ids });
  if (!res.ok) throw new Error(res.error);
  return { success: true };
}

export async function bulkRemoveUserRecent(
  input: { ids: string[] } | { data: { ids: string[] } }
) {
  const ids = "data" in input ? input.data.ids : input.ids;
  const res = await removeRecentMedicinesAction({ productIds: ids });
  if (!res.ok) throw new Error(res.error);
  return { success: true };
}

export async function updateMedicineReminder(_input: unknown) {
  return { success: true };
}

export async function updateUserMedicineOrder(_input: unknown) {
  return { success: true };
}

export async function getUserAuditLogs() {
  return [];
}

export async function bulkUpdateMedicineStatus(_input: unknown) {
  return { success: true };
}
