// app/signin/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/app" });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      await signIn("email", { email, callbackUrl: "/app" });
    } catch (error) {
      console.error("Email sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    const emailToUse = email || "dev@example.com";
    setLoading(true);
    try {
      await signIn("credentials", { email: emailToUse, name: "Dev User", callbackUrl: "/app", redirect: true });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-md gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Sign in to Needix</h1>
      <p className="text-white/70">Use Google to continue, or sign in with email.</p>

      <div className="grid gap-3">
        <Button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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

        {/* Development Login Button (enabled with ENABLE_DEV_AUTH=1) */}
        {process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === '1' && (
          <Button 
            onClick={handleDevLogin}
            disabled={loading}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            Development Login (Local Testing)
          </Button>
        )}

        <div className="flex items-center gap-4 my-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-white/50 text-sm">or</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        {/* Email login option */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-left">
          <label className="mb-2 block text-sm text-white/70">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/50 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
            disabled={loading}
          />
          <Button 
            className="mt-3 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
            onClick={handleEmailSignIn}
            disabled={loading || !email}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sending...
              </div>
            ) : (
              "Send magic link"
            )}
          </Button>
          <p className="mt-2 text-xs text-white/50">
            We&apos;ll send you a secure link to sign in
          </p>
        </div>
      </div>

      <div className="mt-6 text-xs text-white/50">
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
