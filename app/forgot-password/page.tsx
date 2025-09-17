// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'request',
          email 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmailSent(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Reset request error:', error);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm p-8">
            <div className="mb-6 text-6xl">📧</div>
            
            <h1 className="text-2xl font-semibold mb-4">Check your email</h1>
            
            <p className="text-white/70 mb-6 leading-relaxed">
              {message}
            </p>
            
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
              <h3 className="font-medium mb-2">📍 What to do next:</h3>
              <ul className="text-sm text-white/60 space-y-1 text-left">
                <li>1. Check your email inbox</li>
                <li>2. Look for an email from Needix</li>
                <li>3. Click the "Reset Password" link</li>
                <li>4. Create your new password</li>
              </ul>
            </div>
            
            <div className="text-xs text-white/50 mb-6">
              <p>Didn't receive the email? Check your spam folder.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                  setMessage("");
                  setError("");
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Try Different Email
              </Button>
              
              <Link href="/signin">
                <Button variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">Forgot your password?</h1>
          <p className="text-white/70">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && !emailSent && (
              <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
                {message}
              </div>
            )}

            {/* Email Input */}
            <label className="block">
              <span className="mb-2 block text-sm text-white/70">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-white/50 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                disabled={loading}
                required
              />
            </label>

            <Button 
              type="submit"
              className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
              disabled={loading || !email}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending reset link...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="mt-4 text-center">
              <Link 
                href="/signin" 
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </form>

        <div className="mt-6 text-xs text-white/50 text-center">
          <p>
            Remember your password?{" "}
            <Link href="/signin" className="text-purple-400 hover:text-purple-300">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}