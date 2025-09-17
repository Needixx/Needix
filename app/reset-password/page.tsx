// app/reset-password/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    setToken(tokenParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Invalid reset link");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reset',
          token,
          newPassword: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/signin?message=password-reset-success');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-8">
            <div className="mb-6 text-6xl">❌</div>
            <h1 className="text-2xl font-semibold mb-4">Invalid Reset Link</h1>
            <p className="text-white/70 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/forgot-password">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Request New Reset Link
                </Button>
              </Link>
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

  if (success) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm p-8">
            <div className="mb-6 text-6xl">✅</div>
            <h1 className="text-2xl font-semibold mb-4">Password Reset Successful!</h1>
            <p className="text-white/70 mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/signin">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Sign In Now
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/50">
              Redirecting to sign in page in 3 seconds...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">Create New Password</h1>
          <p className="text-white/70">
            Enter your new password below. Make sure it's strong and secure.
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

            {/* New Password Input */}
            <label className="block mb-4">
              <span className="mb-2 block text-sm text-white/70">New Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-white/50 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                disabled={loading}
                required
                minLength={6}
              />
              <p className="mt-1 text-xs text-white/50">
                Minimum 6 characters
              </p>
            </label>

            {/* Confirm Password Input */}
            <label className="block mb-4">
              <span className="mb-2 block text-sm text-white/70">Confirm New Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-white/50 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                disabled={loading}
                required
                minLength={6}
              />
            </label>

            {/* Password Match Indicator */}
            {password && confirmPassword && (
              <div className={`mb-4 text-sm ${
                password === confirmPassword ? 'text-green-400' : 'text-red-400'
              }`}>
                {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}

            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Resetting password...
                </div>
              ) : (
                "Reset Password"
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
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}