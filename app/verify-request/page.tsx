// app/verify-request/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function VerifyRequest() {
  const router = useRouter();

  return (
    <main className="mx-auto grid max-w-md gap-6 px-4 py-16 text-center">
      <div className="mb-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-white/70 mt-2">
          We&apos;ve sent a magic link to your email address.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-white/60 text-sm">
          Click the link in the email to sign in to your account. The link will expire in 24 hours for security.
        </p>
        
        <div className="bg-white/5 rounded-lg p-4 text-left">
          <h3 className="font-medium text-white mb-2">Didn&apos;t receive the email?</h3>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• Check your spam/junk folder</li>
            <li>• Make sure you entered the correct email address</li>
            <li>• Wait a few minutes - it can take some time</li>
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={() => router.push("/signin")}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
        >
          Back to sign in
        </Button>
        
        <button
          onClick={() => router.push("/contact")}
          className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
        >
          Need help? Contact support
        </button>
      </div>
    </main>
  );
}