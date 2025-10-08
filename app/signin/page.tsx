// app/signin/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const isNative = false; // Removed Capacitor check - web only

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkError = () => {
      if (!mounted) return;

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
    };

    checkError();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const handleCredentialsAuth = async (e: React.FormEvent) => {
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

        // After successful signup, sign in
        const result = await signIn("credentials", {
          email,
          password,
          callbackUrl: "/dashboard",
          redirect: false,
        });

        if (result?.error) {
          setError("Account created but failed to sign in. Please try signing in manually.");
        } else if (result?.ok) {
          setError("");
          router.push("/dashboard");
        }
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          callbackUrl: "/dashboard",
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else if (result?.ok) {
          setError("");
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      await signIn("google", { 
        callbackUrl: "/dashboard", 
        redirect: true 
      });
    } catch (err) {
      console.error("Google sign in error:", err);
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  const handleDevLogin = async () => {
    const emailToUse = email || "dev@example.com";
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: emailToUse,
        name: "Dev User",
        redirect: false,
      });
      
      if (result?.ok) {
        setError("");
        router.push("/dashboard");
      } else {
        setError("Dev login failed");
      }
    } catch (e) {
      console.error(e);
      setError("Dev login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(120,119,198,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(34,211,238,0.1),transparent_50%)]" />
      
      {/* Content */}
      <main className="relative z-10 mx-auto grid max-w-md gap-6 px-4 py-16 min-h-screen justify-center">
        {/* Logo/Header */}
        <div className="text-center mb-4">
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-purple-500/30 mb-4">
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Needix
            </span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">
            {mode === "signin" ? "Welcome back" : "Join Needix"}
          </h1>
          <p className="text-white/70 mt-2">
            {mode === "signin"
              ? "Sign in to manage your subscriptions"
              : "Start tracking your subscriptions smarter"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="grid gap-4">
          {/* Google Sign-in */}
          <Button
            onClick={() => void handleGoogleSignIn()}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-12 backdrop-blur-sm"
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

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-white/50 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Email/Password Form */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <form onSubmit={handleCredentialsAuth} className="grid gap-4">
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
          <div className="text-center text-sm text-white/70">
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
                onClick={() => void handleDevLogin()}
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