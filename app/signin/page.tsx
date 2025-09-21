// app/signin/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

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
        const data: SignupResp =
          raw && typeof raw === "object" ? (raw as SignupResp) : {};

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
          setError("Invalid email or password. Please check your credentials and try again.");
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
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      // Use redirect: true to actually navigate to Google's OAuth page
      await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: true
      });
    } catch (err) {
      console.error("Google sign in error:", err);
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    const emailToUse = email || "dev@example.com";
    setLoading(true);
    setError("");
    try {
      await signIn("credentials", { 
        email: emailToUse, 
        name: "Dev User", 
        callbackUrl: "/dashboard", 
        redirect: true 
      });
    } catch (e) {
      console.error(e);
      setError("Dev login failed");
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-md gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">
          {mode === "signin" ? "Sign in to Needix" : "Create your Needix account"}
        </h1>
        <p className="text-white/70 mt-2">
          {mode === "signin" 
            ? "Welcome back! Sign in to manage your subscriptions." 
            : "Join thousands of users managing their subscriptions smarter."
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        <Button 
          onClick={() => void handleGoogleSignIn()}
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
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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

        <form onSubmit={(e) => void handleCredentialsAuth(e)} className="grid gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80"
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

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
            >
              Forgot your password?
            </button>
          </div>
          
          <div className="text-sm text-white/60 text-center">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </form>

        {process.env.ENABLE_DEV_AUTH === "1" && (
          <Button 
            onClick={() => void handleDevLogin()}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 h-11"
          >
            🔧 Dev Login
          </Button>
        )}
      </div>

      <div className="mt-6 text-xs text-white/50 text-center">
        By signing in, you agree to our{" "}
        <a href="/terms" className="text-purple-400 hover:text-purple-300">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-purple-400 hover:text-purple-300">
          Privacy Policy
        </a>
      </div>
    </main>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto grid max-w-md gap-6 px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Loading...</span>
          </div>
        </main>
      }
    >
      <SignInForm />
    </Suspense>
  );
}