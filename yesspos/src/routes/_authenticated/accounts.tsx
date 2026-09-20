import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, Repeat, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listCashAccountsAction,
  createCashAccountAction,
  listAccountTransactionsAction,
  createAccountTransactionAction,
  deleteAccountTransactionAction,
} from "@/actions/cash-accounts";
import { money, useI18n } from "@/lib/i18n";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "Cash & bank accounts — Bazar Bari" },
      { name: "description", content: "Manage cash boxes, bank and mobile banking accounts with deposits, withdrawals and transfers." },
      { property: "og:title", content: "Cash & bank accounts — Bazar Bari" },
      { property: "og:description", content: "Deposits, withdrawals and account transfers in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountsPage,
});

const accountSchema = z.object({
  name: z.string().trim().min(1).max(80),
  opening_balance: z.number().min(-10_000_000).max(100_000_000),
});

const txnSchema = z.object({ amount: z.number().positive().max(100_000_000) });

const emptyAccount = {
  name: "",
  type: "cash",
  bank_name: "",
  branch: "",
  account_number: "",
  opening_balance: "0",
  note: "",
};

const emptyTxn = { type: "deposit", account_id: "", to_account_id: "", amount: "0", note: "", txn_date: "" };

type CashAccount = {
  id: string;
  name: string;
  type: string;
  bank_name?: string | null;
  branch?: string | null;
  account_number?: string | null;
  opening_balance?: number;
};

type AccountTxn = {
  id: string;
  type: string;
  account_id?: string | null;
  to_account_id?: string | null;
  amount: number;
  note?: string | null;
  txn_date?: string;
};

function AccountsPage() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [accOpen, setAccOpen] = useState(false);
  const [txnOpen, setTxnOpen] = useState(false);
  const [accForm, setAccForm] = useState({ ...emptyAccount });
  const [txnForm, setTxnForm] = useState({ ...emptyTxn });

  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await listCashAccountsAction();
      if (!res.ok) throw new Error(res.error);
      return res.rows as CashAccount[];
    },
  });

  const txns = useQuery({
    queryKey: ["account-transactions"],
    queryFn: async () => {
      const res = await listAccountTransactionsAction();
      if (!res.ok) throw new Error(res.error);
      return res.rows as AccountTxn[];
    },
  });

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts.data ?? []) map.set(String(a.id), Number(a.opening_balance ?? 0));
    for (const x of txns.data ?? []) {
      const amt = Number(x.amount);
      if (x.type === "deposit" && x.account_id) map.set(x.account_id, (map.get(x.account_id) ?? 0) + amt);
      if (x.type === "withdraw" && x.account_id) map.set(x.account_id, (map.get(x.account_id) ?? 0) - amt);
      if (x.type === "transfer") {
        if (x.account_id) map.set(x.account_id, (map.get(x.account_id) ?? 0) - amt);
        if (x.to_account_id) map.set(x.to_account_id, (map.get(x.to_account_id) ?? 0) + amt);
      }
    }
    return map;
  }, [accounts.data, txns.data]);

  const totalBalance = [...balances.values()].reduce((s, v) => s + v, 0);

  const saveAccount = useMutation({
    mutationFn: async () => {
      const parsed = accountSchema.safeParse({ ...accForm, opening_balance: Number(accForm.opening_balance) });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const res = await createCashAccountAction({
        name: parsed.data.name,
        type: accForm.type,
        openingBalance: parsed.data.opening_balance,
        bankName: accForm.bank_name || null,
        accountNumber: accForm.account_number || null,
        note: accForm.note || null,
      });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      void logAudit("account_create", { entity: "account" });
      setAccOpen(false);
      setAccForm({ ...emptyAccount });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(t("saved"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const saveTxn = useMutation({
    mutationFn: async () => {
      const parsed = txnSchema.safeParse({ amount: Number(txnForm.amount) });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!txnForm.account_id) throw new Error(t("fromAccount"));
      if (txnForm.type === "transfer" && !txnForm.to_account_id) throw new Error(t("toAccount"));
      if (txnForm.type === "transfer" && txnForm.to_account_id === txnForm.account_id)
        throw new Error(t("toAccount"));
      const res = await createAccountTransactionAction({
        type: txnForm.type,
        accountId: txnForm.account_id,
        toAccountId: txnForm.type === "transfer" ? txnForm.to_account_id : null,
        amount: parsed.data.amount,
        note: txnForm.note || null,
      });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => {
      void logAudit("account_txn", { entity: "account_transaction" });
      setTxnOpen(false);
      setTxnForm({ ...emptyTxn });
      qc.invalidateQueries({ queryKey: ["account-transactions"] });
      toast.success(t("saved"));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const removeTxn = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteAccountTransactionAction({ id });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["account-transactions"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const accName = (id: string | null | undefined) =>
    accounts.data?.find((a) => a.id === id)?.name ?? "—";

  const openTxn = (type: string) => {
    setTxnForm({ ...emptyTxn, type, account_id: String(accounts.data?.[0]?.id ?? "") });
    setTxnOpen(true);
  };

  const typeIcon = (type: string) =>
    type === "bank" ? Landmark : type === "mobile" ? Repeat : Wallet;

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("accounts")}</h1>
          <p className="text-sm text-muted-foreground">{t("accountsHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openTxn("deposit")}>
            <ArrowDownLeft className="mr-1 size-4" /> {t("deposit")}
          </Button>
          <Button variant="outline" onClick={() => openTxn("withdraw")}>
            <ArrowUpRight className="mr-1 size-4" /> {t("withdraw")}
          </Button>
          <Button variant="outline" onClick={() => openTxn("transfer")}>
            <Repeat className="mr-1 size-4" /> {t("transfer")}
          </Button>
          <Button onClick={() => setAccOpen(true)}>
            <Plus className="mr-1 size-4" /> {t("addAccount")}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="surface-panel p-4">
          <p className="text-xs uppercase text-muted-foreground">{t("currentBal")}</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{money(totalBalance, lang)}</p>
        </div>
        {(accounts.data ?? []).map((a) => {
          const Icon = typeIcon(a.type);
          return (
            <div key={a.id} className="surface-panel p-4">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="font-medium">{a.name}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {a.bank_name ? `${a.bank_name}${a.branch ? " · " + a.branch : ""}` : a.type}
                {a.account_number ? ` · ${a.account_number}` : ""}
              </p>
              <p className="mt-2 font-display text-xl font-bold">{money(balances.get(a.id) ?? 0, lang)}</p>
            </div>
          );
        })}
      </div>

      <div className="surface-panel mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("date")}</th>
              <th className="px-4 py-3">{t("type")}</th>
              <th className="px-4 py-3">{t("fromAccount")}</th>
              <th className="px-4 py-3">{t("toAccount")}</th>
              <th className="px-4 py-3">{t("note")}</th>
              <th className="px-4 py-3 text-right">{t("amount")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(txns.data ?? []).map((x) => (
              <tr key={x.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{x.txn_date}</td>
                <td className="px-4 py-3">
                  {x.type === "deposit" ? t("deposit") : x.type === "withdraw" ? t("withdraw") : t("transfer")}
                </td>
                <td className="px-4 py-3">{accName(x.account_id)}</td>
                <td className="px-4 py-3">{x.type === "transfer" ? accName(x.to_account_id) : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{x.note ?? "—"}</td>
                <td className="px-4 py-3 text-right font-semibold">{money(Number(x.amount), lang)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => removeTxn.mutate(x.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {(txns.data ?? []).length === 0 && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                  {txns.isLoading ? t("loading") : t("noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={accOpen} onOpenChange={setAccOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("addAccount")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("accountName")}</Label>
              <Input value={accForm.name} maxLength={80} onChange={(e) => setAccForm({ ...accForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("accountType")}</Label>
              <Select value={accForm.type} onValueChange={(v) => setAccForm({ ...accForm, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("cash")}</SelectItem>
                  <SelectItem value="bank">{t("bank")}</SelectItem>
                  <SelectItem value="mobile">{t("mobileBanking")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("bankName")}</Label>
              <Input value={accForm.bank_name} onChange={(e) => setAccForm({ ...accForm, bank_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("branch")}</Label>
              <Input value={accForm.branch} onChange={(e) => setAccForm({ ...accForm, branch: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("accountNumber")}</Label>
              <Input value={accForm.account_number} onChange={(e) => setAccForm({ ...accForm, account_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("openingBal")}</Label>
              <Input
                inputMode="decimal"
                value={accForm.opening_balance}
                onChange={(e) => setAccForm({ ...accForm, opening_balance: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("note")}</Label>
              <Input value={accForm.note} maxLength={200} onChange={(e) => setAccForm({ ...accForm, note: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAccOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={() => saveAccount.mutate()} disabled={saveAccount.isPending}>
              {t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={txnOpen} onOpenChange={setTxnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {txnForm.type === "deposit" ? t("deposit") : txnForm.type === "withdraw" ? t("withdraw") : t("transfer")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>{t("fromAccount")}</Label>
              <Select value={txnForm.account_id} onValueChange={(v) => setTxnForm({ ...txnForm, account_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("accountName")} />
                </SelectTrigger>
                <SelectContent>
                  {(accounts.data ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {txnForm.type === "transfer" && (
              <div className="space-y-1.5">
                <Label>{t("toAccount")}</Label>
                <Select value={txnForm.to_account_id} onValueChange={(v) => setTxnForm({ ...txnForm, to_account_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("accountName")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(accounts.data ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("amount")}</Label>
                <Input inputMode="decimal" value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("date")}</Label>
                <Input type="date" value={txnForm.txn_date} onChange={(e) => setTxnForm({ ...txnForm, txn_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("note")}</Label>
              <Input value={txnForm.note} maxLength={200} onChange={(e) => setTxnForm({ ...txnForm, note: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTxnOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={() => saveTxn.mutate()} disabled={saveTxn.isPending}>
                {t("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
