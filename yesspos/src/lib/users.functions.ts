/**
 * Staff user management — thin wrappers around Server Actions
 * (replaces supabaseAdmin.auth.admin + is_admin RPC).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  APP_ROLES,
  createAppUserAction,
  setUserPasswordAction,
  deleteAppUserAction,
} from "@/actions/staff";

export { APP_ROLES };
export type AppRole = (typeof APP_ROLES)[number];

const roleEnum = z.enum(APP_ROLES);

const createSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9_.]+$/, "Username: lowercase letters, numbers, _ or . only"),
  password: z.string().min(6).max(72),
  fullName: z.string().trim().max(80),
  role: roleEnum,
});

export const createAppUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data }) => {
    const result = await createAppUserAction(data);
    if (!result.ok) throw new Error(result.error);
    return { id: result.id! };
  });

export const setUserPassword = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(6).max(72) }).parse(input),
  )
  .handler(async ({ data }) => {
    const result = await setUserPasswordAction(data);
    if (!result.ok) throw new Error(result.error);
    return { ok: true };
  });

export const deleteAppUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const result = await deleteAppUserAction(data);
    if (!result.ok) throw new Error(result.error);
    return { ok: true };
  });
