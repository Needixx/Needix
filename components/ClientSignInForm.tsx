// components/ClientSignInForm.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Capacitor } from "@capacitor/core";

const isNative = typeof window !== "undefined" && (Capacitor?.isNativePlatform?.() ?? false);

export default function ClientSignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [mounted, setMounted] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Development auth check
  const isDevAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === "1";

  useEffect(() => {
    setMounted(true);
    
    const errorParam = searchParams.get("error");
    const message = searchParams.get("message");

    if (message) {
      setError("");
    } else if (errorParam) {
      switch (errorParam) {
        case "CredentialsSignin":
          setError("Invalid email or password. Please try again.");
          break;
        case "AccessDenied":
          setError("Access denied. Please try again.");
          break;
        case "OAuthSignin":
          setError("Unable to connect to Google. Please try again.");
          break;
        case "OAuthCallback":
          setError("Google authentication encountered an issue. Please try again.");
          break;
        case "OAuthCreateAccount":
          setError("Unable to create account with Google. Please try manual sign-up.");
          break;
        case "EmailCreateAccount":
          setError("Unable to create account. Please try again.");
          break;
        case "Callback":
          setError("Authentication callback failed. Please try again.");
          break;
        case "OAuthAccountNotLinked":
          setError("This email is already associated with another account. Please sign in with your email and password.");
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
      if (mode === "signup") {
        const signupResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        type SignupResp = { error?: string };
        const raw: unknown = await signupResponse.json();
        const data: SignupResp = raw && typeof raw === "object" ? (raw as SignupResp) : {};

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
  }, [email, password, mode, router]);

  const handleGoogleSignIn = useCallback(async () => {
    if (isNative) {
      setError("Google sign-in isn't available in the mobile app yet. Please use email and password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/dashboard", redirect: true });
    } catch (err) {
      console.error("Google sign in error:", err);
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  }, []);

  const handleDevLogin = useCallback(async () => {
    const emailToUse = email || "dev@example.com";
    setLoading(true);
    setError("");
    try {
      await signIn("credentials", {
        email: emailToUse,
        name: "Dev User",
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (e) {
      console.error(e);
      setError("Dev login failed");
      setLoading(false);
    }
  }, [email]);

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <main className="mx-auto grid max-w-md gap-6 px-4 py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-md gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">
          {mode === "signin" ? "Sign in to Needix" : "Create your Needix account"}
        </h1>
        <p className="text-white/70 mt-2">
          {mode === "signin"
            ? "Welcome back! Sign in to manage your subscriptions."
            : "Join thousands of users managing their subscriptions smarter."}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        {!isNative && (
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-11"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        )}

        {!isNative && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-white/50 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>
        )}

        {isNative && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">
            <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            Google sign-in isn't available in the iOS app yet. Use email & password below.
          </div>
        )}

        <form onSubmit={handleCredentialsAuth} className="grid gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/50 hover:text-white/80"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 h-11"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </div>
            ) : (
              mode === "signin" ? "Sign in" : "Create account"
            )}
          </Button>
        </form>

        {/* Development Login Button */}
        {isDevAuthEnabled && (
          <Button
            onClick={handleDevLogin}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-11"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Dev Login...
              </div>
            ) : (
              "Development Login"
            )}
          </Button>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-white/70 hover:text-white text-sm"
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="text-center">
          <a
            href="/forgot-password"
            className="text-white/70 hover:text-white text-sm"
          >
            Forgot your password?
          </a>
        </div>
      </div>
    </main>
  );
}