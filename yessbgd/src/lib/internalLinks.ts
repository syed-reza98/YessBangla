// Internal link catalogue for the dashboard menu editor: static routes plus
// every page created from the dashboard (`/p/<slug>`).
import { useMemo } from "react";
import { useSitePages } from "@/lib/sitePages";

export type LinkOption = { value: string; label: string; group: string };

export const STATIC_LINKS: LinkOption[] = [
  { value: "/", label: "Home — হোম", group: "Main" },
  { value: "/about", label: "About — আমাদের সম্পর্কে", group: "Main" },
  { value: "/about/leadership", label: "Leadership — নেতৃত্ব", group: "About" },
  { value: "/about/methodology", label: "Methodology — পদ্ধতি", group: "About" },
  { value: "/about/standards", label: "Standards — মানদণ্ড", group: "About" },
  { value: "/about/awards", label: "Awards — স্বীকৃতি", group: "About" },
  { value: "/services", label: "Services — সেবা", group: "Main" },
  { value: "/industries", label: "Industries — খাত", group: "Main" },
  { value: "/ventures", label: "Ventures — ভেঞ্চার", group: "Main" },
  { value: "/projects", label: "Projects — প্রকল্প", group: "Main" },
  { value: "/insights", label: "Insights — ইনসাইট", group: "Main" },
  { value: "/careers", label: "Careers — ক্যারিয়ার", group: "Careers" },
  { value: "/application-status", label: "Application status — আবেদনের অবস্থা", group: "Careers" },
  { value: "/contact", label: "Contact — যোগাযোগ", group: "Main" },
  { value: "/faq", label: "FAQ — সাধারণ প্রশ্ন", group: "Support" },
  { value: "/privacy", label: "Privacy policy — গোপনীয়তা", group: "Legal" },
  { value: "/terms", label: "Terms — শর্তাবলি", group: "Legal" },
];

export function useInternalLinkOptions(): LinkOption[] {
  const { data } = useSitePages();
  return useMemo(() => {
    const dynamic: LinkOption[] = (data ?? [])
      .map((p) => ({
        value: p.path || (p.is_custom ? `/p/${p.page}` : ""),
        label: `${p.name}${p.name_bn ? ` — ${p.name_bn}` : ""}`,
        group: p.is_custom ? "Custom pages (/p/)" : "CMS pages",
      }))
      .filter((o) => !!o.value);
    const seen = new Set(STATIC_LINKS.map((s) => s.value));
    return [...STATIC_LINKS, ...dynamic.filter((d) => !seen.has(d.value) && (seen.add(d.value), true))];
  }, [data]);
}
