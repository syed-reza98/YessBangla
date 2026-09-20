import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession, signOut as authSignOut } from "next-auth/react";
import { getMyProfileAction, getMyRolesAction } from "@/actions/auth";

type User = { id: string; email?: string; [key: string]: unknown };
type Session = { user: User; access_token?: string; expires_at?: number };

type Profile = { id: string; name: string; phone: string };

export type AppRole =
  | "super_admin"
  | "admin"
  | "erp_manager"
  | "support_agent"
  | "accountant"
  | "pharmacist"
  | "rider"
  | "doctor"
  | "staff"
  | "customer"
  | "patient"
  | "user";

/** ব্যাক-অফিস ভূমিকাগুলো — এদের যেকোনোটি থাকলে ড্যাশবোর্ডে ঢোকা যাবে */
export const STAFF_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "erp_manager",
  "support_agent",
  "accountant",
  "pharmacist",
  "doctor",
  "staff",
];

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isStaff: boolean;
  hasRole: (r: AppRole) => boolean;
  loading: boolean;
  expired: boolean;
  clearExpired: () => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: naSession, status, update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [expired, setExpired] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);

  const loadMeta = async () => {
    if (!naSession?.user?.id) {
      setProfile(null);
      setRoles([]);
      return;
    }
    setMetaLoading(true);
    try {
      const [rolesRes, profileRes] = await Promise.all([
        getMyRolesAction(),
        getMyProfileAction(),
      ]);
      if (rolesRes.ok && rolesRes.roles) {
        setRoles(rolesRes.roles as AppRole[]);
      } else {
        const sessionRole = (naSession.user as { role?: string }).role;
        setRoles(sessionRole ? [sessionRole as AppRole] : ["customer"]);
      }
      if (profileRes.ok) {
        setProfile(profileRes.data);
      }
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    void loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naSession?.user?.id]);

  const session: Session | null = useMemo(() => {
    if (!naSession?.user?.id) return null;
    return {
      user: {
        id: naSession.user.id,
        email: naSession.user.email ?? undefined,
        name: naSession.user.name ?? undefined,
        role: (naSession.user as { role?: string }).role,
      },
    };
  }, [naSession]);

  const hasRole = (r: AppRole) => roles.includes(r);
  const isSuperAdmin = hasRole("super_admin");
  const isAdmin = isSuperAdmin || hasRole("admin");
  const isStaff = isAdmin || STAFF_ROLES.some((r) => roles.includes(r));

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    profile,
    roles,
    isAdmin,
    isSuperAdmin,
    isStaff,
    hasRole,
    loading: status === "loading" || metaLoading,
    expired,
    clearExpired: () => setExpired(false),
    refresh: async () => {
      await update();
      await loadMeta();
    },
    signOut: async () => {
      setExpired(false);
      await authSignOut({ redirect: false });
      setProfile(null);
      setRoles([]);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
