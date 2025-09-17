// lib/auth.ts
import NextAuth from "next-auth";
import type { User } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

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
    async session({ session }) {
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
});
