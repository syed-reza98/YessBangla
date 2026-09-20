import { requireStaff } from "@/lib/authz";

// Auth middleware enforcing staff session for Next.js 16 + Auth.js
export const requireSupabaseAuth = {
  server: async (fn: any) => {
    return async (...args: any[]) => {
      await requireStaff();
      return fn(...args);
    };
  },
};
