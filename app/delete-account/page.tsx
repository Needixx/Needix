// app/delete-account/page.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function DeleteAccountPage() {
  const { data: session } = useSession();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
        <h1 className="mb-6 text-2xl font-bold text-red-400">Delete Your Account</h1>

        <div className="space-y-6 text-gray-300">
          <p className="leading-relaxed">
            We&apos;re sorry to see you go. If you delete your Needix account, the following will happen:
          </p>

          <ul className="list-inside list-disc space-y-2">
            <li>All your subscription data will be permanently deleted</li>
            <li>Your account information will be removed from our systems</li>
            <li>You will lose access to all Pro features (if applicable)</li>
            <li>This action cannot be undone</li>
          </ul>

          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
            <h3 className="mb-2 font-medium text-yellow-400">Before you delete your account:</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-yellow-200">
              <li>Export your subscription data if you want to keep it</li>
              <li>Cancel any active Pro subscriptions through your billing page</li>
              <li>Consider if you just want to take a break instead</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">How to delete your account:</h3>
            <ol className="list-inside list-decimal space-y-3">
              <li>
                <strong>Email us:</strong>{" "}
                <a
                  href="mailto:needix2025@gmail.com?subject=Delete%20Account%20Request"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  needix2025@gmail.com
                </a>
              </li>
              <li>
                <strong>Include:</strong> Your account email address and &quot;Delete Account Request&quot; in the subject line
              </li>
              <li>
                <strong>Verification:</strong> We&apos;ll verify your identity and process the deletion within 48 hours
              </li>
              <li>
                <strong>Confirmation:</strong> You&apos;ll receive an email confirmation when your account is deleted
              </li>
            </ol>
          </div>

          {session?.user && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-sm text-blue-200">
                <strong>Your current account:</strong> {session.user.email}
              </p>
            </div>
          )}

          <div className="border-t border-white/10 pt-6">
            <h3 className="mb-3 text-lg font-medium text-white">Need help instead?</h3>
            <p className="mb-4 text-sm text-gray-400">
              If you&apos;re having issues with the app, please contact us first. We&apos;re here to help!
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:needix2025@gmail.com?subject=Needix%20Support"
                className="rounded-lg bg-cyan-600 px-4 py-2 text-center text-white transition-colors hover:bg-cyan-700"
              >
                Contact Support
              </a>

              <Link
                href="/dashboard"
                className="rounded-lg bg-gray-600 px-4 py-2 text-center text-white transition-colors hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
