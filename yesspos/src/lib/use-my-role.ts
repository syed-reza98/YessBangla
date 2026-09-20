import { useQuery } from "@tanstack/react-query";
import { getMyProfileAction } from "@/actions/customers";
import { APP_ROLES, type AppRole } from "@/lib/users.functions";

/** Current user id + highest-priority role, cached across the app. */
export function useMyRole() {
  return useQuery({
    queryKey: ["my-role"],
    staleTime: 60_000,
    queryFn: async (): Promise<{
      userId: string | null;
      username: string | null;
      role: AppRole | null;
    }> => {
      const res = await getMyProfileAction();
      if (!res.ok) return { userId: null, username: null, role: null };
      const role =
        res.role && APP_ROLES.includes(res.role as AppRole)
          ? (res.role as AppRole)
          : null;
      return {
        userId: res.userId,
        username: res.username,
        role,
      };
    },
  });
}
