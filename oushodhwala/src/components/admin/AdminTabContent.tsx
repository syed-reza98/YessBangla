"use client";

import dynamic from "next/dynamic";
import { AdminDashboard } from "@/components/AdminDashboard";
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
import { StaffRoles } from "@/components/StaffRoles";
import { PermissionMatrix } from "@/components/PermissionMatrix";
import { ExpensesAdmin, ChartOfAccounts, JournalAdmin, DayBook, Financials, PartyStatement } from "@/components/FinanceAdmin";
import { StockAdjustments, StockCount, LabelPrint } from "@/components/StockOpsAdmin";
import { BranchesAdmin, StockTransfers, DeliveryZonesAdmin } from "@/components/BranchesAdmin";
import { MediaGallery, MediaPickerModal } from "@/components/MediaGallery";
import { ImageAudit } from "@/components/ImageAudit";
import { ImageRevisions } from "@/components/ImageRevisions";
import { Workspace } from "@/components/Workspace";
import type { AdminNavGroup } from "@/components/AdminShell";
import { Dashboard } from "@/components/admin/tabs/Dashboard";
import { Orders } from "@/components/admin/tabs/Orders";
import { Inventory } from "@/components/admin/tabs/Inventory";
import { Products } from "@/components/admin/tabs/Products";
import { Categories } from "@/components/admin/tabs/Categories";
import { Offers } from "@/components/admin/tabs/Offers";
import { LabTests } from "@/components/admin/tabs/LabTests";
import { Doctors } from "@/components/admin/tabs/Doctors";
import { Settings } from "@/components/admin/tabs/Settings";
import { TestReportView } from "@/components/TestReportView";

const PosTerminalDynamic = dynamic(
  () => import("@/components/PosTerminal").then((m) => m.PosTerminal),
  { ssr: false, loading: () => <p className="p-4 text-sm text-muted-foreground">POS লোড হচ্ছে…</p> }
);

export type AdminTabId = string;

export function AdminTabContent({
  tab,
  visibleGroups,
  onNavigate,
}: {
  tab: AdminTabId;
  visibleGroups: AdminNavGroup[];
  onNavigate: (id: string) => void;
}) {
  return (
    <>
      {tab === "dash" && <Dashboard />}
      {tab === "workspace" && <Workspace groups={visibleGroups} onOpen={onNavigate} />}
      {tab === "pos" && <PosTerminalDynamic />}
      {tab === "expenses" && <ExpensesAdmin />}
      {tab === "coa" && <ChartOfAccounts />}
      {tab === "journal" && <JournalAdmin />}
      {tab === "daybook" && <DayBook />}
      {tab === "financials" && <Financials />}
      {tab === "party" && <PartyStatement />}
      {tab === "stockadj" && <StockAdjustments />}
      {tab === "stockcount" && <StockCount />}
      {tab === "labels" && <LabelPrint />}
      {tab === "branches" && <BranchesAdmin />}
      {tab === "transfers" && <StockTransfers />}
      {tab === "zones" && <DeliveryZonesAdmin />}
      {tab === "orders" && <Orders />}
      {tab === "inventory" && <Inventory />}
      {tab === "products" && <Products />}
      {tab === "categories" && <Categories />}
      {tab === "offers" && <Offers />}
      {tab === "lab" && <LabTests />}
      {tab === "doctors" && <Doctors />}
      {tab === "rx" && <RxAdmin />}
      {tab === "consults" && <Consultations />}
      {tab === "delivery" && <DeliveryAdmin />}
      {tab === "riders" && <RidersAdmin />}
      {tab === "diagnostics" && <DiagnosticsAdmin />}
      {tab === "services" && <ServiceRequestsAdmin />}
      {tab === "gallery" && <MediaGallery />}
      {tab === "imgaudit" && <ImageAudit />}
      {tab === "imgrev" && <ImageRevisions />}
      {tab === "imgupload" && <ProductImagesAdmin />}
      {tab === "health" && <AdminHealth onNavigate={onNavigate} />}
      {tab === "customers" && <CustomersAdmin />}
      {tab === "loyalty" && <LoyaltyAdmin />}
      {tab === "campaigns" && <CampaignsAdmin />}
      {tab === "returns" && <ReturnsAdmin />}
      {tab === "reviews" && <ReviewsAdmin />}
      {tab === "accounts" && <AccountsAdmin />}
      {tab === "suppliers" && <SuppliersAdmin />}
      {tab === "po" && <PurchaseOrdersAdmin />}
      {tab === "batches" && <BatchesAdmin />}
      {tab === "monitor" && <SystemMonitor />}
      {tab === "audit" && <ErpAudit />}
      {tab === "erpreports" && <ErpReports />}
      {tab === "erproles" && <ErpRoles />}
      {tab === "apihub" && <ApiHub />}
      {tab === "support" && <SupportInbox />}
      {tab === "reports" && <ReportsAdmin />}
      {tab === "staff" && <StaffRoles />}
      {tab === "perms" && <PermissionMatrix />}
      {tab === "permissions" && <PermissionMatrix />}
      {tab === "purchases" && <PurchaseOrdersAdmin />}
      {tab === "settings" && <Settings />}
      {tab === "tests" && <TestReportView />}
      {tab === "mediapicker" && <MediaPickerModal open onClose={() => onNavigate("gallery")} onPick={() => undefined} />}
    </>
  );
}
