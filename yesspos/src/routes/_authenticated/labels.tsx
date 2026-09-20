import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listProductsAction } from "@/actions/catalog";
import { getBusinessSettingsAction } from "@/actions/settings";
import { money, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/labels")({
  head: () => ({
    meta: [
      { title: "Barcode labels — Bazar Bari" },
      { name: "description", content: "Print barcode price labels for any product, sized for sticker sheets." },
      { property: "og:title", content: "Barcode labels — Bazar Bari" },
      { property: "og:description", content: "Print barcode price label sheets." },
    ],
  }),
  component: LabelsPage,
});

function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        width: 1.4,
        height: 38,
        fontSize: 12,
        margin: 0,
        displayValue: true,
      });
    } catch {
      /* invalid barcode value */
    }
  }, [value]);
  return <svg ref={ref} className="mx-auto" />;
}

type LabelProduct = {
  id: string;
  name_en?: string | null;
  name_bn?: string | null;
  barcode?: string | null;
  sku?: string | null;
  price?: number | string | null;
};

function LabelsPage() {
  const { t, lang } = useI18n();
  const [productId, setProductId] = useState("");
  const [count, setCount] = useState("12");

  const products = useQuery({
    queryKey: ["products-labels"],
    queryFn: async () => {
      const res = await listProductsAction();
      if (!res.ok) throw new Error(res.error);
      return res.rows as LabelProduct[];
    },
  });

  const product = products.data?.find((p) => p.id === productId) ?? null;
  const code = String(product?.barcode ?? "").trim() || String(product?.sku ?? "");
  const qty = Math.min(Math.max(Number(count) || 1, 1), 120);
  const shopName = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const res = await getBusinessSettingsAction();
      const data = res.ok ? res.settings : null;
      return String(data?.shop_name ?? "");
    },
  });

  return (
    <div className="p-4">
      <div className="print:hidden">
        <h1 className="font-display text-2xl font-bold">{t("labels")}</h1>

        <div className="surface-panel mt-4 grid max-w-3xl gap-3 p-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("selectProduct")}</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectProduct")} />
              </SelectTrigger>
              <SelectContent>
                {(products.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {(lang === "bn" ? p.name_bn : p.name_en) + ` · ${p.barcode || p.sku}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("labelCount")}</Label>
            <Input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={() => window.print()} disabled={!product || !code}>
              <Printer className="mr-1 size-4" /> {t("printLabels")}
            </Button>
            {product && !code && <span className="ml-3 text-sm text-destructive">{t("noBarcode")}</span>}
          </div>
        </div>
      </div>

      {product && code && (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4">
          {Array.from({ length: qty }).map((_, i) => (
            <div key={i} className="rounded-md border border-border p-2 text-center">
              <p className="truncate text-[11px] font-medium">{shopName.data}</p>
              <p className="truncate text-xs font-semibold">{lang === "bn" ? product.name_bn : product.name_en}</p>
              <Barcode value={code} />
              <p className="text-xs font-bold">{money(Number(product.price), lang)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
