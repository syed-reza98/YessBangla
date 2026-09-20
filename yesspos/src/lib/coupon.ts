/** Storefront promo codes — validated via Server Action against MySQL coupons. */
import { validateCouponAction } from "@/actions/coupons";

export type CouponResult = {
  ok: boolean;
  code: string;
  discount: number;
  reason: string;
  message: string;
};

function messageFor(reason: string, bn: boolean, min?: number) {
  switch (reason) {
    case "ok":
      return bn ? "কুপন প্রয়োগ হয়েছে" : "Coupon applied";
    case "not_found":
      return bn ? "কুপন কোডটি সঠিক নয়" : "That promo code does not exist";
    case "inactive":
      return bn
        ? "এই কুপনটি এই অর্ডারে প্রযোজ্য নয়"
        : "This promo code is not applicable to your order";
    case "not_started":
      return bn
        ? "এই কুপনটি এখনো চালু হয়নি"
        : "This promo code is not active yet";
    case "expired":
      return bn ? "কুপনের মেয়াদ শেষ হয়ে গেছে" : "This promo code has expired";
    case "limit_reached":
      return bn
        ? "এই কুপনের ব্যবহারের সীমা শেষ"
        : "This promo code has reached its usage limit";
    case "min_amount":
      return bn
        ? `ন্যূনতম অর্ডার পূরণ হয়নি${min ? ` — কমপক্ষে ৳${min} কিনুন` : ""}`
        : `Minimum order not met${min ? ` — spend at least ৳${min}` : ""}`;
    case "empty":
      return bn ? "প্রোমো কোড লিখুন" : "Enter a promo code";
    default:
      return bn ? "কুপন যাচাই করা যায়নি" : "Could not check that promo code";
  }
}

export async function applyCoupon(
  code: string,
  subtotal: number,
  bn: boolean,
): Promise<CouponResult> {
  const result = await validateCouponAction({ code, subtotal });
  return {
    ok: result.ok && result.discount > 0,
    code: result.code,
    discount: result.discount,
    reason: result.reason,
    message: messageFor(result.reason, bn),
  };
}
