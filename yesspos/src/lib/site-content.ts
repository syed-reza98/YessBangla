import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listSiteContentAction } from "@/actions/customers";
import { useI18n } from "@/lib/i18n";

export type SiteContentRow = {
  id: string;
  key: string;
  group_name: string;
  label: string;
  kind: string;
  value_bn: string;
  value_en: string;
  sort_order: number;
};

export const SITE_CONTENT_KEY = ["site-content"] as const;

async function fetchSiteContent(): Promise<SiteContentRow[]> {
  const res = await listSiteContentAction();
  if (!res.ok) throw new Error(res.error);
  return (res.rows ?? []) as SiteContentRow[];
}

/** All editable site texts. */
export function useSiteContent() {
  const { lang } = useI18n();

  const query = useQuery({
    queryKey: SITE_CONTENT_KEY,
    queryFn: fetchSiteContent,
    staleTime: 60_000,
  });

  const data = query.data;
  const rows = useMemo(() => data ?? [], [data]);

  /** Text for a key in the active language, falling back to the given default. */
  const text = (key: string, fallback = "") => {
    const row = rows.find((r) => r.key === key);
    if (!row) return fallback;
    const value = (lang === "bn" ? row.value_bn : row.value_en)?.trim();
    const other = (lang === "bn" ? row.value_en : row.value_bn)?.trim();
    return value || other || fallback;
  };

  return { rows, text, isLoading: query.isLoading };
}
