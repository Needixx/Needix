// lib/auth.ts
import NextAuth from "next-auth";
import type { User } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    // Optional development credentials provider to bypass Google when testing locally
    ...(process.env.ENABLE_DEV_AUTH === "1"
      ? [
          Credentials({
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "text" },
              name: { label: "Name", type: "text" },
            },
            async authorize(credentials): Promise<User | null> {
              const email = credentials?.email as string | undefined;
              const name = (credentials?.name as string | undefined) || (email ? email.split("@")[0] : undefined);
              if (!email) return null;
              const user: User = { id: email, email, name };
              return user;
            },
          }),
        ]
      : []),
  ],
  pages: { 
    signIn: "/signin",
    error: "/signin"
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after successful auth
      if (url.includes('/app') || url === baseUrl) {
        return `${baseUrl}/dashboard`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});