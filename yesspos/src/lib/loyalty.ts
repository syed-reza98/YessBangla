import {
  applyLoyaltyAction,
  registerMemberAction,
  type Member,
} from "@/actions/loyalty";

/** Loyalty rules: 1 point per 10 currency spent (100৳ = 10 points). */
export const POINTS_PER_CURRENCY_SPENT = 0.1;
/** Points can only be spent once the balance reaches this. */
export const REDEEM_MIN_POINTS = 1000;
/** 10 points = 1 currency unit of discount. */
export const POINTS_PER_CURRENCY = 10;

export type { Member };

/** Points earned for a purchase amount. */
export function pointsFor(amount: number): number {
  return Math.floor(Math.max(amount, 0) / 10);
}

/** Currency value of a point balance. */
export function pointsToMoney(points: number): number {
  return Math.max(points, 0) / POINTS_PER_CURRENCY;
}

/** How many points a member may spend on a bill of `total`. */
export function maxRedeemable(balance: number, total: number): number {
  if (!Number.isFinite(balance) || balance < REDEEM_MIN_POINTS) return 0;
  return Math.max(0, Math.min(Math.floor(balance), Math.floor(total * POINTS_PER_CURRENCY)));
}

/** Register (or look up) a member by phone — works from any branch. */
export async function registerMember(phone: string, name: string): Promise<Member> {
  const res = await registerMemberAction({ phone, name });
  if (!res.ok) throw new Error(res.error);
  return res.member;
}

/** Redeem + earn points for a finalised sale. Returns the new balance. */
export async function applyLoyalty(input: {
  contactId: string;
  saleId: string | null;
  amount: number;
  redeemPoints: number;
  branchId: string | null;
}): Promise<number> {
  const res = await applyLoyaltyAction({
    contactId: input.contactId,
    saleId: input.saleId,
    amount: input.amount,
    redeemPoints: input.redeemPoints,
    branchId: input.branchId,
  });
  if (!res.ok) throw new Error(res.error);
  return res.balance;
}
