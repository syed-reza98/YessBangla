/** Turn a plain address, Google Maps link, or pasted <iframe> into an embeddable map URL. */
export function toMapEmbedSrc(value: string): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (/^https?:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(v)) return v;
  if (/^<iframe/i.test(v)) {
    const m = v.match(/src="([^"]+)"/i);
    if (m) return m[1];
  }
  if (/^https?:\/\//i.test(v)) return v;
  return `https://www.google.com/maps?q=${encodeURIComponent(v)}&z=16&output=embed`;
}
