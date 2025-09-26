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
        name: { label: 'Name', type: 'text', optional: true },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email) {
          throw new Error('Email is required');
        }

        // Special handling for dev login
        if (process.env.NODE_ENV === 'development' && 
            process.env.ENABLE_DEV_AUTH && 
            credentials.name === 'Dev User') {
          return {
            id: 'dev-user',
            email: credentials.email as string,
            name: 'Dev User',
            image: null,
          };
        }

        if (!credentials?.password) {
          throw new Error('Password is required');
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
      // Skip database operations for dev login
      if (user.id === 'dev-user') {
        return true;
      }

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
    async redirect({ url, baseUrl }) {
      console.log('Auth redirect:', { url, baseUrl });
      
      // Handle mobile app redirects
      if (typeof window !== 'undefined') {
        try {
          const { Capacitor } = await import('@capacitor/core');
          if (Capacitor.isNativePlatform()) {
            // For mobile app, always redirect to dashboard
            return '/dashboard';
          }
        } catch {
          // Capacitor not available, continue with web logic
        }
      }

      // If this is a callback URL, let it proceed normally
      if (url.includes('/api/auth/callback')) {
        return url;
      }

      // Prevent redirect loops - if we're already on signin, go to dashboard
      if (url.includes('/signin')) {
        return baseUrl + '/dashboard';
      }

      // Handle dashboard and app routes
      if (url.includes('/dashboard')) {
        return baseUrl + '/dashboard';
      }
      
      if (url.includes('/app')) {
        return baseUrl + '/dashboard';
      }
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        return baseUrl + url;
      }

      // Handle same-origin URLs
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Default to dashboard for successful auth
      return baseUrl + '/dashboard';
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
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
  events: {
    async signIn({ user, account }) {
      console.log('User signed in:', { 
        userId: user.id, 
        provider: account?.provider,
        email: user.email 
      });
    },
  },
  debug: process.env.NODE_ENV === 'development',
});