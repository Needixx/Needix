// app/signin/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Capacitor } from '@capacitor/core';
import { MobileAuth } from '@/lib/mobile-simple-auth';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const isNative = Capacitor.isNativePlatform();
  const isDevAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === '1';

  // Redirect if already authenticated
  useEffect(() => {
    if (!isNative && status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router, isNative]);

  // Check mobile session on mount
  useEffect(() => {
    if (isNative) {
      MobileAuth.isLoggedIn().then(loggedIn => {
        if (loggedIn) {
          router.push("/dashboard");
        }
      });
    }
  }, [isNative, router]);

  // Handle auth errors from URL params
  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "OAuthAccountNotLinked":
          setError("This email is already registered with a different method. Please sign in with your email and password.");
          break;
        case "EmailSignin":
          setError("Unable to send verification email. Please try again.");
          break;
        case "CredentialsSignup":
          setError("Unable to create account. Please try again.");
          break;
        case "SessionRequired":
          setError("Please sign in to continue.");
          break;
        default:
          setError("An error occurred during sign in. Please try again.");
      }
    }
  }, [searchParams]);

  const handleCredentialsAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // MOBILE AUTH
      if (isNative) {
        if (mode === "signup") {
          const result = await MobileAuth.signup(email, password);
          if (result.success) {
            router.push("/dashboard");
          } else {
            setError(result.error || "Failed to create account");
          }
        } else {
          const result = await MobileAuth.signin(email, password);
          if (result.success) {
            router.push("/dashboard");
          } else {
            setError(result.error || "Invalid email or password");
          }
        }
        setLoading(false);
        return;
      }

      // WEB AUTH
      if (mode === "signup") {
        const signupResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await signupResponse.json();

        if (!signupResponse.ok) {
          setError(data.error ?? "Failed to create account");
          setLoading(false);
          return;
        }

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Account created but failed to sign in. Please try signing in manually.");
        } else {
          router.push("/dashboard");
        }
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          if (result.error.includes("Google")) {
            setError("This email is associated with a Google account. Please sign in with Google or use 'Create account' to add a password.");
          } else if (result.error.includes("No account found")) {
            setError("No account found with this email. Please check your email or sign up.");
          } else {
            setError("Invalid email or password. Please check your credentials and try again.");
          }
        } else if (result?.ok) {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, password, mode, router, isNative]);

  const handleGoogleSignIn = useCallback(async () => {
    if (isNative) {
      setError("Google sign-in isn't available in the mobile app yet. Please use email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  }, [isNative]);

  const handleDevLogin = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (isNative) {
        await MobileAuth.signup("dev@example.com", "dev", "Dev User");
        router.push("/dashboard");
      } else {
        const result = await signIn("credentials", {
          email: "dev@example.com",
          password: "dev",
          name: "Dev User",
          redirect: false,
        });

        if (result?.error) {
          setError("Development login failed");
        } else if (result?.ok) {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Dev login error:", err);
      setError("Dev login failed");
    } finally {
      setLoading(false);
    }
  }, [router, isNative]);

  // Show loading while checking session
  if (!isNative && status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render the form if already authenticated (web only)
  if (!isNative && status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
      <main className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-white/70 text-sm">
              {mode === "signin"
                ? "Sign in to manage your subscriptions"
                : "Get started with Needix"}
            </p>
            {isNative && (
              <p className="text-purple-400 text-xs mt-2">📱 Mobile App</p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleCredentialsAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {!isNative && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/10 text-white/70">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                type="button"
                disabled={loading}
                className="w-full py-3 px-4 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              type="button"
            >
              {mode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          {isDevAuthEnabled && (
            <div className="mt-4">
              <button
                onClick={handleDevLogin}
                type="button"
                className="w-full py-2 px-4 bg-yellow-600/20 border border-yellow-600/50 text-yellow-200 text-sm font-medium rounded-lg hover:bg-yellow-600/30 transition-all"
              >
                🔧 Development Login
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}