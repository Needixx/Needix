// app/reset-password/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link");
      setCheckingToken(false);
      return;
    }

    // Validate token
    const validateToken = async () => {
      try {
        const response = await fetch("/api/auth/validate-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.valid) {
          setIsValidToken(true);
        } else {
          setError(data.error || "Invalid or expired reset token");
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setError("Failed to validate reset token");
      } finally {
        setCheckingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to sign in with success message
        router.push("/signin?message=Password reset successfully. Please sign in with your new password.");
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <main className="mx-auto grid max-w-md gap-6 px-4 py-16 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Validating reset link...</span>
        </div>
      </main>
    );
  }

  if (!isValidToken) {
    return (
      <main className="mx-auto grid max-w-md gap-6 px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-400">Invalid Reset Link</h1>
          <p className="text-white/70 mt-2">
            {error || "This password reset link is invalid or has expired."}
          </p>
        </div>
        
        <Button 
          onClick={() => router.push("/forgot-password")}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
        >
          Request New Reset Link
        </Button>
        
        <div className="text-center">
          <button
            onClick={() => router.push("/signin")}
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-md gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Set New Password</h1>
        <p className="text-white/70 mt-2">
          Enter your new password below.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter new password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Confirm new password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
            >
              {showConfirmPassword ? (
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
              Updating password...
            </div>
          ) : (
            "Update Password"
          )}
        </Button>
      </form>

      <div className="text-center">
        <button
          onClick={() => router.push("/signin")}
          className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
        >
          Back to sign in
        </button>
      </div>

      <div className="text-xs text-white/50 text-center">
        Password must be at least 6 characters long and match the confirmation.
      </div>
    </main>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <main className="mx-auto grid max-w-md gap-6 px-4 py-16 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}