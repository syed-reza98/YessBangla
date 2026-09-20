import { useQuery } from "@tanstack/react-query";
import {
  getMyProfileAction,
  listBranchesAction,
} from "@/actions/customers";
import { listProductStockAction } from "@/actions/catalog";

export type Branch = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
};

/** All branches of the business. */
export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    staleTime: 60_000,
    queryFn: async (): Promise<Branch[]> => {
      const res = await listBranchesAction();
      if (!res.ok) throw new Error(res.error);
      return (res.rows ?? []) as Branch[];
    },
  });
}

/** The branch the signed-in user belongs to. */
export function useMyBranch() {
  return useQuery({
    queryKey: ["my-branch"],
    staleTime: 60_000,
    queryFn: async (): Promise<Branch | null> => {
      const profile = await getMyProfileAction();
      if (!profile.ok || !profile.branchId) return null;
      const branches = await listBranchesAction();
      if (!branches.ok) return null;
      return (
        ((branches.rows ?? []).find((b) => b.id === profile.branchId) as Branch) ??
        null
      );
    },
  });
}

/** product_id -> stock quantity for one branch. */
export function useBranchStock(branchId: string | null | undefined) {
  return useQuery({
    queryKey: ["branch-stock", branchId],
    enabled: !!branchId,
    staleTime: 15_000,
    queryFn: async () => {
      const res = await listProductStockAction({ branchId: branchId as string });
      if (!res.ok) throw new Error(res.error);
      return new Map<string, number>(
        (res.rows ?? []).map((r) => [
          String(r.product_id),
          Number(r.stock ?? 0),
        ])
      );
    },
  });
}
