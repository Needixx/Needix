// app/auth/popup-success/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PopupSuccessContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is running in a popup
    if (window.opener && !window.opener.closed) {
      // Send success message to parent window
      const success = !searchParams.get('error');
      const googleConnected = searchParams.get('google_connected') === 'true';
      
      window.opener.postMessage({
        type: 'OAUTH_SUCCESS',
        success,
        googleConnected
      }, window.location.origin);
      
      // Close the popup
      window.close();
    } else {
      // If not in popup, redirect to dashboard
      const returnUrl = searchParams.get('returnUrl') || '/dashboard?tab=settings&section=integrations&google_connected=true';
      window.location.href = returnUrl;
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-purple-500/30 mb-4">
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Needix
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          {searchParams.get('error') ? 'Connection Failed' : 'Successfully Connected!'}
        </h1>
        <p className="text-white/70">
          {searchParams.get('error') 
            ? 'There was an issue connecting your account. Please try again.' 
            : 'Closing window and returning to settings...'}
        </p>
        {searchParams.get('error') && (
          <button 
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Close Window
          </button>
        )}
      </div>
    </div>
  );
}

export default function PopupSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-purple-500/30 mb-4">
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Needix
            </span>
          </div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <PopupSuccessContent />
    </Suspense>
  );
}