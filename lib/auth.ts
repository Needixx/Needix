// lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

// Use require for bcrypt to avoid edge runtime issues
const bcrypt = require('bcryptjs');

export const {
  auth,
  signIn,
  signOut,
  handlers,
} = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' }, // Use JWT instead of database sessions
  // Remove adapter to avoid Prisma on edge runtime
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          throw new Error('No account found with this email');
        }

        // If user doesn't have a password, they originally signed up with Google
        // But we'll allow them to set a password now
        if (!user.password) {
          throw new Error('This account was created with Google. Please sign in with Google, or use "Forgot Password" to set a password for email login.');
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
    signIn: async (params) => {
      const { user, account } = params;
      
      // Only handle database operations for Google provider
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email || '' },
          });

          if (existingUser) {
            // Update existing user - allow Google login even if they have a password
            await prisma.user.update({
              where: { email: user.email || '' },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: new Date(), // Mark as verified since Google verified it
              },
            });
          } else {
            // Create new user
            await prisma.user.create({
              data: {
                email: user.email || '',
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
              },
            });
          }
          return true;
        } catch (error) {
          console.error('Error handling Google sign-in:', error);
          return false;
        }
      }
      return true;
    },
    redirect: async (params) => {
      const { url, baseUrl } = params;
      
      // Always redirect to dashboard after successful sign-in
      if (url.startsWith(baseUrl)) {
        if (url === baseUrl || url === `${baseUrl}/` || url === `${baseUrl}/signin`) {
          return `${baseUrl}/dashboard`;
        }
        return url;
      }
      
      return `${baseUrl}/dashboard`;
    },
    jwt: async (params) => {
      const { token, user, account } = params;
      
      // Add user info to token on sign-in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // For Google sign-in, get the user ID from database
      if (account?.provider === 'google' && user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
          }
        } catch (error) {
          console.error('Error getting user ID:', error);
        }
      }
      
      return token;
    },
    session: async (params) => {
      const { session, token } = params;
      
      // Add user ID and other info from token to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      
      return session;
    },
  },
  events: {
    signIn: (params) => {
      const { user, account } = params;
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
});

// Export handlers for the API route
export const { GET, POST } = handlers;