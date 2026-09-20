import { useQuery } from "@tanstack/react-query";
import { MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { listOrderEventsAction } from "@/actions/delivery";
import { useI18n } from "@/lib/i18n";

type OrderEvent = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
};

/**
 * Staff-facing order event history for a delivery order.
 * (Customer feedback submit lives on /track via submitDeliveryFeedbackAction.)
 */
export function OrderFeedback({ orderId }: { orderId: string }) {
  const { lang } = useI18n();
  const bn = lang === "bn";

  const list = useQuery({
    queryKey: ["delivery-order-events", orderId],
    queryFn: async () => {
      const result = await listOrderEventsAction({ orderId });
      if (!result.ok) {
        toast.error(result.error);
        throw new Error(result.error);
      }
      return result.events as OrderEvent[];
    },
  });

  const rows = list.data ?? [];
  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
        <MessageSquareWarning className="size-4 text-primary" />
        {bn ? "অর্ডার ইভেন্ট" : "Order events"}
      </p>
      <ol className="space-y-2">
        {rows.map((e) => (
          <li key={e.id} className="rounded-md bg-muted/60 p-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                {e.status}
              </span>
              <span className="text-muted-foreground">
                {String(e.created_at).slice(0, 16).replace("T", " ")}
              </span>
            </div>
            {e.note && <p className="mt-1">{e.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
