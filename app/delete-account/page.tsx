// app/delete-account/page.tsx

import { auth } from "@/lib/auth";

export default async function DeleteAccountPage() {
  const session = await auth();
  
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
        <h1 className="text-2xl font-bold mb-6 text-red-400">Delete Your Account</h1>
        
        <div className="space-y-6 text-gray-300">
          <p className="leading-relaxed">
            We&rsquo;re sorry to see you go. If you delete your Needix account, the following will happen:
          </p>
          
          <ul className="space-y-2 list-disc list-inside">
            <li>All your subscription data will be permanently deleted</li>
            <li>Your account information will be removed from our systems</li>
            <li>You will lose access to all Pro features (if applicable)</li>
            <li>This action cannot be undone</li>
          </ul>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h3 className="text-yellow-400 font-medium mb-2">Before you delete your account:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-yellow-200">
              <li>Export your subscription data if you want to keep it</li>
              <li>Cancel any active Pro subscriptions through your billing page</li>
              <li>Consider if you just want to take a break instead</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">How to delete your account:</h3>
            <ol className="space-y-3 list-decimal list-inside">
              <li>
                <strong>Email us:</strong> Send a deletion request to{" "}
                <a href="mailto:needix2025@gmail.com" className="text-cyan-400 hover:text-cyan-300">
                  needix2025@gmail.com
                </a>
              </li>
              <li>
                <strong>Include:</strong> Your account email address and &ldquo;Delete Account Request&rdquo; in the subject line
              </li>
              <li>
                <strong>Verification:</strong> We&rsquo;ll verify your identity and process the deletion within 48 hours
              </li>
              <li>
                <strong>Confirmation:</strong> You&rsquo;ll receive an email confirmation when your account is deleted
              </li>
            </ol>
          </div>
          
          {session?.user && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                <strong>Your current account:</strong> {session.user.email}
              </p>
            </div>
          )}
          
          <div className="pt-6 border-t border-white/10">
            <h3 className="text-lg font-medium text-white mb-3">Need help instead?</h3>
            <p className="text-sm text-gray-400 mb-4">
              If you&rsquo;re having issues with the app, please contact us first. We&rsquo;re here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:needix2025@gmail.com"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-center transition-colors"
              >
                Contact Support
              </a>
              <a
                href="/app"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-center transition-colors"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
