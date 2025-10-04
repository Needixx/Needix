// app/signin/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Capacitor } from "@capacitor/core";

const isNative = typeof window !== "undefined" && (Capacitor?.isNativePlatform?.() ?? false);

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
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
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  }, []);

  const handleDevLogin = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
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
    } catch (err) {
      console.error("Dev login error:", err);
      setError("Dev login failed");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render the form if already authenticated
  if (status === "authenticated") {
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
                : "Sign up to start tracking your subscriptions"}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          {!isNative && (
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              variant="secondary"
              className="w-full mb-6 bg-white hover:bg-white/90 text-gray-900 border-0 h-12"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </div>
              )}
            </Button>
          )}

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/10 px-2 text-white/60">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <div className="space-y-6">
            <form onSubmit={handleCredentialsAuth} className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium text-white/90">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-white placeholder:text-white/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 backdrop-blur-sm"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium text-white/90">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-3 pr-12 text-white placeholder:text-white/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 backdrop-blur-sm"
                    placeholder="Enter your password"
                    required
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 h-12 mt-2"
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
          </div>

          {/* Mode Toggle */}
          <div className="text-center text-sm text-white/70 mt-6">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="text-purple-300 hover:text-purple-200 underline"
                >
                  Create one here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className="text-purple-300 hover:text-purple-200 underline"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>

          {/* Development Login - Only if enabled */}
          {process.env.NODE_ENV === "development" && 
           process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH && (
            <div className="mt-6 pt-4 border-t border-white/20">
              <Button
                onClick={handleDevLogin}
                disabled={loading}
                variant="ghost"
                className="w-full text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
              >
                🚀 Development Login
              </Button>
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