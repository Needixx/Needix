// lib/auth.ts
import NextAuth from 'next-auth';
import type { User } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, ensure user exists in database
      if (account?.provider && account.provider !== 'credentials') {
        try {
          await prisma.user.upsert({
            where: { email: user.email || '' },
            update: {
              name: user.name,
              image: user.image,
            },
            create: {
              email: user.email || '',
              name: user.name,
              image: user.image,
            },
          });
        } catch (error) {
          console.error('Error creating/updating user:', error);
          return false;
        }
      }
      return true;
    },
    redirect({ url, baseUrl }) {
      if (url.includes('/app') || url === baseUrl) {
        return `${baseUrl}/dashboard`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async session({ session, token: _token }) {
      if (session.user && session.user.email) {
        // Get the actual user ID from the database
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        
        if (dbUser) {
          const userWithId = session.user as User & { id?: string };
          userWithId.id = dbUser.id;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // For OAuth, get the database user ID
        if (account.provider !== 'credentials') {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email || '' },
            select: { id: true },
          });
          if (dbUser) {
            token.sub = dbUser.id;
          }
        } else {
          // For credentials, use the ID from authorize
          token.sub = user.id;
        }
      }
      return token;
    },
  },
  events: {
    signIn({ user, account }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
});