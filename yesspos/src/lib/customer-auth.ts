import { useCallback, useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { customerSignUpAction } from "@/actions/auth";

export type User = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
};

export const CUSTOMER_DOMAIN = "shopper.yesspos.app";

export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("880")) return `0${digits.slice(3)}`;
  if (digits.length === 10 && digits.startsWith("1")) return `0${digits}`;
  return digits;
}

export function isValidPhone(input: string) {
  return /^01[3-9]\d{8}$/.test(normalizePhone(input));
}

export function phoneToEmail(phone: string) {
  return `${normalizePhone(phone)}@${CUSTOMER_DOMAIN}`;
}

export type CustomerSession = {
  user: User | null;
  phone: string;
  name: string;
  loading: boolean;
  isCustomer: boolean;
};

/** Live shopper session via Auth.js. Staff accounts (other email domains) are not shoppers. */
export function useCustomerSession(): CustomerSession {
  const session = useSession();
  const data = session?.data;
  const status = session?.status ?? "unauthenticated";
  const loading = status === "loading";
  const user: User | null = data?.user
    ? {
        id: (data.user as { id?: string }).id || data.user.email || "",
        email: data.user.email,
        user_metadata: {
          role: (data.user as { role?: string }).role,
          full_name: data.user.name,
          phone: (data.user as { phone?: string }).phone,
        },
      }
    : null;

  const email = user?.email ?? "";
  const isCustomer = email.endsWith(`@${CUSTOMER_DOMAIN}`);
  return {
    user,
    loading,
    isCustomer,
    phone: isCustomer
      ? email.split("@")[0]
      : (user?.user_metadata?.phone as string) ?? "",
    name: (user?.user_metadata?.full_name as string) ?? data?.user?.name ?? "",
  };
}

export async function customerSignIn(phone: string, pin: string) {
  const result = await signIn("credentials", {
    email: phoneToEmail(phone),
    password: pin,
    redirect: false,
  });
  if (result?.error) throw new Error(result.error);
}

export async function customerSignUp(phone: string, pin: string, fullName: string) {
  const email = phoneToEmail(phone);
  const created = await customerSignUpAction({
    email,
    password: pin,
    fullName,
    phone: normalizePhone(phone),
  });
  if (!created.ok) throw new Error(created.error);
  await customerSignIn(phone, pin);
}

export function useCustomerSignOut() {
  return useCallback(async () => {
    await signOut({ redirect: false });
  }, []);
}
