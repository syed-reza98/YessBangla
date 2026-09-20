import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users, profiles, userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const emailStr = String(credentials.email).toLowerCase().trim();

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, emailStr))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        );
        if (!isValid) return null;

        const [roleRow] = await db
          .select()
          .from(userRoles)
          .where(eq(userRoles.userId, user.id))
          .limit(1);

        const [profileRow] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, user.id))
          .limit(1);

        return {
          id: user.id,
          email: user.email,
          name: profileRow?.fullName || user.email.split("@")[0],
          role: roleRow?.role || "user",
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      if (!path.startsWith("/admin") || path.startsWith("/admin/login")) {
        return true;
      }
      if (!session?.user) return false;
      const role = (session.user as { role?: string }).role || "user";
      return role === "admin" || role === "moderator";
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
});
