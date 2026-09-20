/**
 * Auth.js-backed guard for legacy createServerFn handlers.
 * Usage: export const fn = createServerFn(...).middleware([requireSupabaseAuth]).handler(...)
 * For new code prefer src/lib/session-authz.ts requireAuth / requireRole.
 */
export const requireSupabaseAuth = {
  server: <T extends (...args: any[]) => any>(fn: T): T => {
    const wrapped = (async (...args: any[]) => {
      const { auth } = await import("@/auth");
      const session = await auth();
      if (!session?.user?.id) {
        throw new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      return fn(...args);
    }) as T;
    return wrapped;
  },
};
