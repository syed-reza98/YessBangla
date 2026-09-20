/**
 * Cross-device cart sync.
 *
 * Guests keep the localStorage-only cart. When a customer has an Auth.js
 * session, the local cart is merged with the cart saved on their account
 * (highest quantity per product wins), the merged result is written back to
 * both sides, and every later local change is pushed via saveCartAction with
 * a short debounce.
 */
import { useEffect, useRef } from "react";
import { getCartAction, saveCartAction, type CartLine } from "@/actions/checkout";
import {
  CART_EVENT,
  readCart,
  writeCart,
  type ShopLine,
} from "@/lib/shop-cart";

function mergeCarts(local: ShopLine[], remote: ShopLine[]): ShopLine[] {
  const map = new Map<string, ShopLine>();
  for (const l of remote) map.set(l.id, { ...l });
  for (const l of local) {
    const found = map.get(l.id);
    map.set(l.id, found ? { ...l, qty: Math.max(found.qty, l.qty) } : { ...l });
  }
  return [...map.values()].filter((l) => l.qty > 0);
}

function toShopLines(lines: CartLine[]): ShopLine[] {
  return lines
    .filter((l) => l.id && l.qty > 0)
    .map((l) => ({
      id: l.id,
      name_en: l.name_en ?? "",
      name_bn: l.name_bn ?? l.name_en ?? "",
      price: Number(l.price ?? 0),
      pack_size: l.pack_size ?? null,
      image_url: null,
      qty: l.qty,
    }));
}

function toCartLines(lines: ShopLine[]): CartLine[] {
  return lines.map((l) => ({
    id: l.id,
    qty: l.qty,
    name_en: l.name_en,
    name_bn: l.name_bn,
    price: l.price,
    pack_size: l.pack_size ?? undefined,
  }));
}

/**
 * Mounted once at the app root. Keeps the signed-in customer's cart saved to
 * their account; a no-op for guests.
 */
export function useCartAccountSync() {
  const ready = useRef(false);
  const authenticated = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function adopt() {
      ready.current = false;
      try {
        const remote = await getCartAction();
        if (cancelled) return;
        if (!remote.ok) {
          authenticated.current = false;
          return;
        }
        authenticated.current = true;
        const merged = mergeCarts(readCart(), toShopLines(remote.lines));
        writeCart(merged);
        const saved = await saveCartAction({ lines: toCartLines(merged) });
        if (!saved.ok && saved.status !== 401) {
          /* keep local cart; push will retry on next change */
        }
      } catch {
        /* offline or blocked — local cart still works */
        authenticated.current = false;
      } finally {
        if (!cancelled) ready.current = true;
      }
    }

    void adopt();

    const onFocus = () => {
      void adopt();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);

    const push = () => {
      if (!authenticated.current || !ready.current) return;
      if (timer.current) clearTimeout(timer.current);
      const snapshot = readCart();
      timer.current = setTimeout(() => {
        void saveCartAction({ lines: toCartLines(snapshot) }).then((r) => {
          if (!r.ok && r.status === 401) authenticated.current = false;
        });
      }, 800);
    };

    window.addEventListener(CART_EVENT, push);
    window.addEventListener("storage", push);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      window.removeEventListener(CART_EVENT, push);
      window.removeEventListener("storage", push);
    };
  }, []);
}

export function CartAccountSync() {
  useCartAccountSync();
  return null;
}
