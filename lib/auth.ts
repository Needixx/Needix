// lib/auth.ts
import NextAuth from "next-auth";
import type { User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { debug } from "@/lib/debug";

// Check if Google OAuth is configured
const isGoogleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Define Credentials provider
const credentialsProvider = Credentials({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
    name: { label: "Name", type: "text", optional: true },
  },
  async authorize(credentials): Promise<User | null> {
    if (!credentials?.email) {
      throw new Error("Email is required");
    }

    // Special handling for dev login
    if (
      process.env.NODE_ENV === "development" &&
      process.env.ENABLE_DEV_AUTH &&
      credentials.name === "Dev User"
    ) {
      return {
        id: "dev-user",
        email: credentials.email as string,
        name: "Dev User",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: credentials.email as string },
    });

    if (!user) {
      throw new Error("No account found with this email");
    }

    // Check if user signed up with Google but is trying to use password
    if (!user.password) {
      throw new Error(
        'This email is associated with a Google account. Please sign in with Google or use "Create account" to add a password.'
      );
    }

    if (!credentials.password) {
      throw new Error("Password is required");
    }

    const isValid = await bcrypt.compare(credentials.password as string, user.password);

    if (!isValid) {
      throw new Error("Invalid password");
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.name,
    };
  },
});

// Define Google provider conditionally
const googleProvider = isGoogleConfigured
  ? Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
        },
      },
    })
  : null;

// Build providers array
const providers = isGoogleConfigured ? [credentialsProvider, googleProvider!] : [credentialsProvider];

if (!isGoogleConfigured) {
  console.warn(
    "Google OAuth not configured. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for Google sign-in."
  );
}

// Safe Buffer helper (never crashes in edge)
const getNodeBuffer = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Buffer: NodeBuffer } = require("buffer");
    return NodeBuffer as typeof Buffer;
  } catch {
    return undefined;
  }
};

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  // Provide a stable secret (prevents CSRF/session churn)
  secret: process.env.AUTH_SECRET,

  // Respect env for trustHost
  trustHost: process.env.AUTH_TRUST_HOST === "true",

  // Keep JWT sessions while you debug (DB not required for /session)
  session: { strategy: "jwt" },

  // Adapter still used for OAuth account storage (tokens)
  adapter: PrismaAdapter(prisma),

  providers,

  pages: {
    signIn: "/signin",
    error: "/signin", // Error page
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      debug.log("Sign in attempt:", {
        provider: account?.provider,
        userEmail: user.email,
        profileEmail: (profile as { email?: string } | null)?.email,
      });

      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: {
              accounts: {
                where: { provider: "google" },
              },
            },
          });

          if (!existingUser) {
            // Create new user for Google sign-in
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || (profile as { name?: string } | null)?.name || "Google User",
                image: user.image,
              },
            });
            debug.log("Created new user for Google sign-in:", user.email);
          } else {
            // Update existing user info
            await prisma.user.update({
              where: { email: user.email! },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
              },
            });

            // Check if Google account is already linked
            const googleAccountExists = existingUser.accounts.some((acc) => acc.provider === "google");

            if (!googleAccountExists) {
              // Link the Google account to existing user (Auth.js will also handle linking)
              debug.log("Linking Google account to existing user:", user.email);
            } else {
              debug.log("Google account already linked for user:", user.email);
            }
          }
        } catch (error) {
          console.error("Error creating/updating user:", error);
          return false;
        }
      }
      return true;
    },

    async redirect({ url, baseUrl }) {
      debug.log("Auth redirect:", { url, baseUrl });

      // Parse the URL to check for special cases
      try {
        const urlObj = new URL(url, baseUrl);

        // Check if this is a Google OAuth callback with our custom state
        if (urlObj.pathname.includes("/api/auth/callback/google")) {
          const state = urlObj.searchParams.get("state");

          if (state) {
            try {
              const NodeBuffer = getNodeBuffer();
              if (NodeBuffer) {
                const decodedState = JSON.parse(NodeBuffer.from(state, "base64").toString());
                if (decodedState.action === "link" && decodedState.returnTo) {
                  debug.log("Google link callback detected, redirecting to:", decodedState.returnTo);
                  return decodedState.returnTo;
                }
              }
            } catch {
              debug.log("State parsing failed or not custom state");
            }
          }

          // Check for explicit callbackUrl parameter
          const callbackUrl = urlObj.searchParams.get("callbackUrl");
          if (callbackUrl) {
            const decodedCallback = decodeURIComponent(callbackUrl);
            debug.log("Google callback with explicit callbackUrl:", decodedCallback);
            return decodedCallback;
          }

          // Default for Google callback
          debug.log("Google callback with no special state, going to integrations");
          return "/dashboard?tab=settings&section=integrations&google_connected=true";
        }

        // Handle specific callback URLs with parameters (for integrations)
        if (
          urlObj.searchParams.has("google_connected") ||
          (urlObj.pathname.includes("/dashboard") && urlObj.searchParams.has("tab"))
        ) {
          return url.startsWith(baseUrl) ? url : baseUrl + url;
        }
      } catch (e) {
        debug.log("URL parsing error in redirect:", e);
      }

      // If this is any callback URL, try to extract the intended destination
      if (url.includes("/api/auth/callback")) {
        try {
          const urlObj = new URL(url, baseUrl);
          const callbackUrl = urlObj.searchParams.get("callbackUrl");
          if (callbackUrl) {
            return decodeURIComponent(callbackUrl);
          }
        } catch {
          // Continue with default logic
        }
        return url;
      }

      // Prevent redirect loops - if we're already on signin, go to dashboard
      if (url.includes("/signin")) {
        return baseUrl + "/dashboard";
      }

      // Handle dashboard and app routes
      if (url.includes("/dashboard")) {
        return baseUrl + "/dashboard";
      }

      if (url.includes("/app")) {
        return baseUrl + "/dashboard";
      }

      // Handle relative URLs
      if (url.startsWith("/")) {
        return baseUrl + url;
      }

      // Handle same-origin URLs
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Default to dashboard for successful auth
      return baseUrl + "/dashboard";
    },

    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },

    async jwt({ token, user, account }) {
      // token is typed (augmented) as our JWT
      const t = token as JWT;

      if (user) {
        t.sub = user.id;
      }

      // Store the access token and refresh token for Gmail API access
      if (account && account.provider === "google") {
        t.accessToken = account.access_token;
        t.refreshToken = account.refresh_token;
        t.expiresAt = account.expires_at ?? undefined;

        // Also store in database for persistence
        if (user?.email) {
          try {
            await prisma.account.updateMany({
              where: {
                provider: "google",
                user: { email: user.email },
              },
              data: {
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at ?? undefined,
                scope: account.scope,
              },
            });
          } catch (error) {
            console.error("Error updating account tokens:", error);
          }
        }
      }

      return t;
    },
  },

  events: {
    async signIn({ user, account }) {
      debug.log("User signed in:", {
        userId: user.id,
        provider: account?.provider,
        email: user.email,
        hasGmailAccess: account?.scope?.includes("gmail.readonly") || false,
      });
    },
  },

  debug: process.env.NODE_ENV === "development",
});

// Export a helper to check if Google OAuth is available
export const isGoogleOAuthEnabled = () => isGoogleConfigured;
