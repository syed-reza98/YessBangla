"use server";

import {
  deleteRxAction,
  getRxSettingsAction,
  saveRxSettingsAction,
} from "@/actions/rx";

function unwrap<T extends Record<string, unknown>>(
  input: T | { data: T }
): T {
  return "data" in input ? (input.data as T) : input;
}

export async function getRxSettings() {
  const res = await getRxSettingsAction();
  if (!res.ok) throw new Error(res.error);
  return { days: res.days, notifyEmail: res.notifyEmail };
}

export async function saveRxSettings(
  input:
    | { days: number; notifyEmail: boolean }
    | { data: { days: number; notifyEmail: boolean } }
) {
  const data = unwrap(input);
  const res = await saveRxSettingsAction(data);
  if (!res.ok) throw new Error(res.error);
  return { days: res.days, notifyEmail: res.notifyEmail };
}

export async function deleteRx(
  input: { id: string } | { data: { id: string } }
) {
  const data = unwrap(input);
  const res = await deleteRxAction({ id: data.id });
  if (!res.ok) throw new Error(res.error);
  return { deleted: res.deleted, files: 0 };
}

export async function rxHousekeeping() {
  const settings = await getRxSettingsAction();
  return { ok: true, keepDays: settings.ok ? settings.days : 0, deleted: 0 };
}
