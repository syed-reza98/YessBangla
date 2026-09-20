import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { bn } from "@/data/catalog";
import { catalogQueryKey } from "@/lib/catalog-db";
import { MediaGallery, MediaPickerModal } from "@/components/MediaGallery";
import { ImageAudit } from "@/components/ImageAudit";
import { ImageRevisions } from "@/components/ImageRevisions";
import { AdminShell, type AdminNavGroup } from "@/components/AdminShell";
import { Consultations } from "@/components/Consultations";
import { DeliveryAdmin, RidersAdmin } from "@/components/DeliveryAdmin";
import { ProductImagesAdmin } from "@/components/ProductImagesAdmin";
import { AdminHealth } from "@/components/AdminHealth";
import { DiagnosticsAdmin } from "@/components/DiagnosticsAdmin";
import { CustomersAdmin } from "@/components/CustomersAdmin";
import { ServiceRequestsAdmin } from "@/components/ServiceRequestsAdmin";
import { AccountsAdmin } from "@/components/AccountsAdmin";
import { SuppliersAdmin, PurchaseOrdersAdmin, BatchesAdmin } from "@/components/ProcurementAdmin";
import { SystemMonitor, ErpAudit, ErpReports, ErpRoles } from "@/components/SystemMonitor";
import { ApiHub } from "@/components/ApiHub";
import { SupportInbox } from "@/components/SupportInbox";
import { ReturnsAdmin, ReviewsAdmin } from "@/components/ModerationAdmin";
import { CampaignsAdmin } from "@/components/CampaignsAdmin";
import { ReportsAdmin } from "@/components/ReportsAdmin";
import { LoyaltyAdmin } from "@/components/LoyaltyAdmin";
import { RxAdmin } from "@/components/RxAdmin";
import { adminExistsAction, claimFirstAdminAction } from "@/actions/admin-rpc";
import { WEEKDAYS } from "@/lib/appointments";
import { opsStart, opsSuccess, opsFailure } from "@/lib/ops";
import { allowedTabs } from "@/lib/roles";
import { StaffRoles } from "@/components/StaffRoles";
import { PermissionMatrix } from "@/components/PermissionMatrix";
import dynamic from "next/dynamic";

const PosTerminalDynamic = dynamic(
  () => import("@/components/PosTerminal").then((m) => m.PosTerminal),
  { ssr: false, loading: () => <p className="p-4 text-sm text-muted-foreground">POS লোড হচ্ছে…</p> }
);
import { ExpensesAdmin, ChartOfAccounts, JournalAdmin, DayBook, Financials, PartyStatement } from "@/components/FinanceAdmin";
import { StockAdjustments, StockCount, LabelPrint } from "@/components/StockOpsAdmin";
import { BranchesAdmin, StockTransfers, DeliveryZonesAdmin } from "@/components/BranchesAdmin";
import { TestReportView } from "@/components/TestReportView";
import { Workspace } from "@/components/Workspace";




export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "অ্যাডমিন প্যানেল — ঔষধওয়ালা" },
      { name: "description", content: "প্রোডাক্ট, ইনভেন্টরি, ক্যাটাগরি, অফার ও অর্ডার ম্যানেজমেন্ট ড্যাশবোর্ড।" },
      { property: "og:title", content: "অ্যাডমিন প্যানেল — ঔষধওয়ালা" },
      { property: "og:description", content: "স্টক, অর্ডার ও ক্যাম্পেইন নিয়ন্ত্রণ করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: Admin,
});

const TABS = [
  { id: "dash", t: "ড্যাশবোর্ড" },
  { id: "workspace", t: "ওয়ার্কস্পেস" },
  { id: "pos", t: "POS / কাউন্টার বিক্রয়" },
  { id: "orders", t: "অর্ডার" },
  { id: "inventory", t: "ইনভেন্টরি" },
  { id: "products", t: "প্রোডাক্ট" },
  { id: "categories", t: "ক্যাটাগরি" },
  { id: "offers", t: "অফার" },
  { id: "lab", t: "ল্যাব টেস্ট" },
  { id: "doctors", t: "ডাক্তার" },
  { id: "rx", t: "প্রেসক্রিপশন" },
  { id: "delivery", t: "ডেলিভারি" },
  { id: "riders", t: "ডেলিভারিম্যান" },
  { id: "diagnostics", t: "হোম ডায়াগনস্টিক" },
  { id: "services", t: "হোম সার্ভিস" },
  { id: "consults", t: "কনসালটেশন" },
  { id: "gallery", t: "ছবি গ্যালারি" },
  { id: "imgaudit", t: "ছবি যাচাই" },
  { id: "imgrev", t: "ছবি রিভিশন" },
  { id: "imgupload", t: "ছবি আপলোড" },
  { id: "health", t: "হেলথ ও QA" },
  { id: "customers", t: "গ্রাহক" },
  { id: "accounts", t: "একাউন্টস ও হিসাব" },
  { id: "returns", t: "রিটার্ন ও রিফান্ড" },
  { id: "reports", t: "রিপোর্ট ও বিশ্লেষণ" },
  { id: "reviews", t: "রিভিউ মডারেশন" },
  { id: "campaigns", t: "মার্কেটিং ক্যাম্পেইন" },
  { id: "loyalty", t: "লয়ালটি পয়েন্ট" },
  { id: "suppliers", t: "সাপ্লায়ার" },
  { id: "purchases", t: "ক্রয় আদেশ" },
  { id: "batches", t: "ব্যাচ ও মেয়াদ" },
  { id: "support", t: "সাপোর্ট চ্যাট" },
  { id: "apihub", t: "API HUB" },
  { id: "monitor", t: "সিস্টেম মনিটর" },
  { id: "audit", t: "ERP অডিট ট্রেইল" },
  { id: "erpreports", t: "ERP রিপোর্ট" },
  { id: "erproles", t: "ERP অ্যাক্সেস" },
  { id: "staff", t: "স্টাফ ও ভূমিকা" },
  { id: "permissions", t: "পারমিশন ম্যাট্রিক্স" },

  { id: "expenses", t: "খরচ" },
  { id: "coa", t: "চার্ট অব অ্যাকাউন্টস" },
  { id: "journal", t: "জার্নাল" },
  { id: "daybook", t: "ডে-বুক" },
  { id: "financials", t: "ফিন্যান্সিয়ালস" },
  { id: "party", t: "পার্টি স্টেটমেন্ট" },
  { id: "stockadj", t: "স্টক অ্যাডজাস্টমেন্ট" },
  { id: "stockcount", t: "স্টক কাউন্ট" },
  { id: "labels", t: "বারকোড ও লেবেল" },
  { id: "branches", t: "শাখা (মাল্টি ব্রাঞ্চ)" },
  { id: "transfers", t: "স্টক ট্রান্সফার" },
  { id: "zones", t: "ডেলিভারি জোন" },
  { id: "tests", t: "Playwright টেস্ট রিপোর্ট" },
  { id: "settings", t: "সেটিংস" },
] as const;

const pickTabs = (ids: string[]) =>
  ids.map((id) => {
    const t = TABS.find((x) => x.id === id)!;
    return { id: t.id, t: t.t, icon: t.id };
  });

const NAV_GROUPS: AdminNavGroup[] = [
  { label: "ওভারভিউ", items: pickTabs(["dash", "workspace"]) },
  { label: "বিক্রয়", items: pickTabs(["pos", "orders", "inventory", "accounts", "reports", "returns"]) },
  { label: "হিসাব ও অ্যাকাউন্টিং", items: pickTabs(["expenses", "daybook", "journal", "coa", "financials", "party"]) },
  { label: "সাপ্লাই চেইন", items: pickTabs(["suppliers", "purchases", "batches", "erpreports"]) },
  { label: "স্টক অপারেশন", items: pickTabs(["stockadj", "stockcount", "labels", "branches", "transfers"]) },
  { label: "ডেলিভারি", items: pickTabs(["delivery", "riders", "zones"]) },
  { label: "ক্যাটালগ", items: pickTabs(["products", "categories", "offers", "campaigns", "loyalty"]) },
  { label: "সেবা", items: pickTabs(["support", "lab", "diagnostics", "services", "doctors", "consults", "rx"]) },
  { label: "মিডিয়া", items: pickTabs(["gallery", "imgupload", "imgaudit", "imgrev"]) },
  { label: "মনিটরিং", items: pickTabs(["apihub", "monitor", "audit", "erproles", "staff", "permissions", "tests"]) },
  { label: "সিস্টেম", items: pickTabs(["customers", "reviews", "health", "settings"]) },
];



type TabId = (typeof TABS)[number]["id"];

/** App Router path segment → primary tab */
export const ADMIN_PATH_TAB: Record<string, TabId> = {
  "": "dash",
  orders: "orders",
  inventory: "inventory",
  pos: "pos",
  products: "products",
  rx: "rx",
  doctors: "doctors",
  diagnostics: "diagnostics",
  delivery: "delivery",
  finance: "accounts",
  customers: "customers",
  staff: "staff",
  support: "support",
};

const TAB_PATH: Partial<Record<TabId, string>> = {
  dash: "/admin",
  orders: "/admin/orders",
  inventory: "/admin/inventory",
  pos: "/admin/pos",
  products: "/admin/products",
  rx: "/admin/rx",
  doctors: "/admin/doctors",
  diagnostics: "/admin/diagnostics",
  delivery: "/admin/delivery",
  accounts: "/admin/finance",
  customers: "/admin/customers",
  staff: "/admin/staff",
  support: "/admin/support",
};

export function Admin({ initialTab }: { initialTab?: TabId } = {}) {
  const { user, isAdmin, isStaff, roles, loading, refresh, signOut } = useAuth();
  const allowed = useMemo(() => allowedTabs(roles), [roles]);
  const visibleGroups = useMemo<AdminNavGroup[]>(() => {
    if (allowed === "all") return NAV_GROUPS;
    return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => allowed.has(i.id)) })).filter(
      (g) => g.items.length > 0,
    );
  }, [allowed]);
  const firstTab = (visibleGroups[0]?.items[0]?.id ?? "dash") as TabId;
  const [tabState, setTabState] = useState<TabId | null>(initialTab ?? null);
  const tab: TabId =
    tabState && (allowed === "all" || allowed.has(tabState)) ? tabState : firstTab;

  const setTab = (id: TabId) => {
    setTabState(id);
    const path = TAB_PATH[id];
    if (path && typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      window.history.replaceState(null, "", path);
    }
  };



  const { data: adminExists, refetch: refetchExists } = useQuery({
    queryKey: ["admin-exists"],
    queryFn: async () => {
      const res = await adminExistsAction();
      if (!res.ok) return false;
      return res.exists === true;
    },
    enabled: !!user && !isAdmin,
  });

  if (loading) return <p className="pt-16 text-center text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  if (!user) {
    return (
      <div className="pt-16 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-3 text-base font-bold">অ্যাডমিন প্যানেল</h1>
        <p className="mt-1 text-xs text-muted-foreground">চালিয়ে যেতে লগইন করুন।</p>
        <Link to="/auth" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
          লগইন করুন
        </Link>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="pt-16 text-center">
        <p className="text-4xl">⛔</p>
        <h1 className="mt-3 text-base font-bold">অ্যাডমিন অনুমতি নেই</h1>
        {adminExists === false && (
          <>
            <p className="mx-auto mt-2 max-w-sm text-xs text-muted-foreground">
              এখনো কোনো অ্যাডমিন নেই। আপনি প্রথম অ্যাডমিন হিসেবে দায়িত্ব নিতে পারেন।
            </p>
            <button
              onClick={async () => {
                const res = await claimFirstAdminAction();
                if (!res.ok) {
                  toast.error(res.error);
                  return;
                }
                if (res.claimed === true) {
                  toast.success("আপনি এখন অ্যাডমিন");
                  await refresh();
                } else {
                  toast.error("ইতিমধ্যে একজন অ্যাডমিন আছেন");
                  void refetchExists();
                }
              }}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              প্রথম অ্যাডমিন হোন
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <AdminShell
      groups={visibleGroups}
      active={tab}
      onSelect={(id) => setTab(id as TabId)}
      title={TABS.find((t) => t.id === tab)?.t ?? "ড্যাশবোর্ড"}
      email={user.email}
      onSignOut={async () => {
        await signOut();
        await refresh();
      }}
    >
      {/* Tab bodies live in AdminTabContent */}
      <AdminTabContent tab={tab} visibleGroups={visibleGroups} onNavigate={(id) => setTab(id as TabId)} />
    
    </AdminShell>
  );
}
