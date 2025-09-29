// app/connect/google/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function ConnectGooglePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // If not authenticated, go to sign in
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    // If authenticated, wait 1 second to show the page, then start OAuth
    if (status === "authenticated" && !connecting) {
      const timer = setTimeout(() => {
        initiateGoogleOAuth();
      }, 1500); // 1.5 second delay so users can see the benefits

      return () => clearTimeout(timer);
    }
  }, [status]);

  const initiateGoogleOAuth = () => {
    setConnecting(true);

    // Use our custom account linking endpoint instead of NextAuth
    // This bypasses the sign-in flow entirely
    window.location.href = '/api/integrations/google/link';
  };

  const handleCancel = () => {
    router.push("/dashboard?tab=settings&section=integrations");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(120,119,198,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(34,211,238,0.1),transparent_50%)]" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-purple-500/30 mb-4">
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Needix
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🔗</div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {status === "loading" ? "Loading..." : "Connecting to Google"}
              </h1>
              <p className="text-white/70">
                {connecting 
                  ? "Redirecting you to Google for secure authentication..."
                  : "Preparing secure connection..."
                }
              </p>
            </div>

            {/* Loading animation */}
            {(status === "loading" || connecting) && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
              </div>
            )}

            {/* Benefits */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">What you'll get:</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Automatically detect subscription receipts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Import existing subscription data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Smart expense categorization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Calendar integration for renewals</span>
                </li>
              </ul>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-xl">🔒</span>
                <div>
                  <h4 className="font-medium text-blue-300 mb-1">Your Privacy Matters</h4>
                  <p className="text-xs text-blue-200/80">
                    We only read subscription-related emails. Your data is encrypted and never shared with third parties.
                  </p>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            {!connecting && status !== "loading" && (
              <Button
                onClick={handleCancel}
                variant="secondary"
                className="w-full"
              >
                Cancel
              </Button>
            )}

            {/* User Info */}
            {session?.user && (
              <div className="text-center text-sm text-white/50">
                Connecting as {session.user.email}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}