import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, profiles, userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const identifier = credentials.email as string;
        const password = credentials.password as string;

        let [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, identifier))
          .limit(1);

        if (!user) {
          const [profile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.phone, identifier))
            .limit(1);

          if (profile) {
            [user] = await db
              .select()
              .from(users)
              .where(eq(users.id, profile.id))
              .limit(1);
          }
        }

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, user.id))
          .limit(1);

        const [roleRow] = await db
          .select()
          .from(userRoles)
          .where(eq(userRoles.userId, user.id))
          .limit(1);

        return {
          id: user.id,
          email: user.email,
          name: profile?.fullName || user.email,
          role: roleRow?.role || profile?.role || "customer",
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/admin")) {
        if (!session?.user) return false;
        const role = (session.user as { role?: string }).role || "customer";
        return [
          "pharmacist",
          "doctor",
          "staff",
          "erp_manager",
          "admin",
          "super_admin",
        ].includes(role);
      }
      if (path.startsWith("/account")) return !!session?.user;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
