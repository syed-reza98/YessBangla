/** @deprecated — use src/actions/catalog.ts */
export function publicClient(): never {
  throw new Error("publicClient removed — use Server Actions under src/actions/");
}
