import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = result[0];
        if (!user || !user.passwordHash) return null;

        // Dynamic import to avoid bundling bcrypt on client
        const { compare } = await import("bcryptjs");
        const isValid = await compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.ownerName ?? user.businessName,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

/**
 * Get the current user's full record from the database.
 * Cached per-request via React.cache().
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return result[0] ?? null;
});

/**
 * Get the current user if they are an admin.
 */
export const getAdminUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return null;
  return user;
});

/**
 * Require an authenticated user. Redirects to /login if not.
 */
export async function requireAuth() {
  const { redirect } = await import("next/navigation");
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require an admin user. Redirects to /login if not.
 */
export async function requireAdmin() {
  const { redirect } = await import("next/navigation");
  const user = await getAdminUser();
  if (!user) redirect("/login");
  return user;
}
