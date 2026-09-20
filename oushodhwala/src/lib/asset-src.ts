/** Next.js static imports are `{ src, width, height }` — normalize to a URL string. */
export function assetSrc(value: string | { src: string } | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value.src || "");
}
