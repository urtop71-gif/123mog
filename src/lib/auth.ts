import { getServerSession } from "next-auth";
import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rateLimit";
import { isTokenVersionCurrent } from "@/lib/tokenVersion";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        if (!rateLimit(`login:${email}`, 10, 10 * 60 * 1000)) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Constant-time-ish delay path: still run a compare-like work is hard without hash;
          // return null uniformly to avoid account enumeration.
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.tokenVersion = user.tokenVersion ?? 0;
        return token;
      }

      const userId = token.id || token.sub;
      if (!userId) return token;

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { tokenVersion: true, email: true, name: true },
      });
      if (!isTokenVersionCurrent(token.tokenVersion, dbUser?.tokenVersion ?? null)) {
        return {};
      }
      token.id = userId;
      token.email = dbUser!.email;
      token.name = dbUser!.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || "";
        session.user.email = token.email || session.user.email || "";
        session.user.name = token.name ?? session.user.name ?? null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions);
}
