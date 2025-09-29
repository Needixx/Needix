// app/dashboard/oauth-status/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface OAuthConfig {
  AUTH_SECRET: boolean;
  NEXTAUTH_URL: string;
  GOOGLE_CLIENT_ID: boolean;
  GOOGLE_CLIENT_SECRET: boolean;
  DATABASE_URL: boolean;
  GOOGLE_CLIENT_ID_PREVIEW: string;
}

export default function OAuthStatusPage() {
  const [config, setConfig] = useState<OAuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch('/api/auth/debug');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
      } finally {
        setLoading(false);
      }
    };

    checkConfig();
  }, []);

  const isGoogleConfigured = config?.GOOGLE_CLIENT_ID && config?.GOOGLE_CLIENT_SECRET;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8">
          <h1 className="text-3xl font-bold text-white mb-6">OAuth Configuration Status</h1>
          
          {loading ? (
            <div className="text-white/70">Checking configuration...</div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <ConfigItem 
                  label="AUTH_SECRET" 
                  isSet={config?.AUTH_SECRET || false}
                />
                <ConfigItem 
                  label="NEXTAUTH_URL" 
                  isSet={!!config?.NEXTAUTH_URL}
                  value={config?.NEXTAUTH_URL}
                />
                <ConfigItem 
                  label="GOOGLE_CLIENT_ID" 
                  isSet={config?.GOOGLE_CLIENT_ID || false}
                  value={config?.GOOGLE_CLIENT_ID_PREVIEW}
                />
                <ConfigItem 
                  label="GOOGLE_CLIENT_SECRET" 
                  isSet={config?.GOOGLE_CLIENT_SECRET || false}
                />
                <ConfigItem 
                  label="DATABASE_URL" 
                  isSet={config?.DATABASE_URL || false}
                />
              </div>

              <div className={`p-4 rounded-lg border ${
                isGoogleConfigured 
                  ? 'bg-green-500/20 border-green-500/40' 
                  : 'bg-red-500/20 border-red-500/40'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  isGoogleConfigured ? 'text-green-300' : 'text-red-300'
                }`}>
                  {isGoogleConfigured ? '✓ Google OAuth is Configured' : '✗ Google OAuth is NOT Configured'}
                </h3>
                <p className={`text-sm ${
                  isGoogleConfigured ? 'text-green-200' : 'text-red-200'
                }`}>
                  {isGoogleConfigured 
                    ? 'You can connect your Google account from the integrations settings.'
                    : 'Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env.local file.'
                  }
                </p>
              </div>

              {!isGoogleConfigured && (
                <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-300 mb-2">How to Fix:</h4>
                  <ol className="text-sm text-blue-200 space-y-2 list-decimal list-inside">
                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Create a new project or select an existing one</li>
                    <li>Enable the Google+ API</li>
                    <li>Go to Credentials → Create OAuth 2.0 Client ID</li>
                    <li>Set authorized redirect URI to: <code className="bg-black/30 px-2 py-1 rounded">http://localhost:3000/api/auth/callback/google</code></li>
                    <li>Copy the Client ID and Client Secret</li>
                    <li>Add them to your <code className="bg-black/30 px-2 py-1 rounded">.env.local</code> file</li>
                    <li>Restart your development server</li>
                  </ol>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={() => router.push('/dashboard?tab=settings&section=integrations')} variant="primary">
                  Back to Integrations
                </Button>
                <Button onClick={() => window.location.reload()} variant="secondary">
                  Refresh Status
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfigItem({ label, isSet, value }: { label: string; isSet: boolean; value?: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div>
        <div className="font-medium text-white">{label}</div>
        {value && <div className="text-sm text-white/60">{value}</div>}
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
        isSet 
          ? 'bg-green-500/20 text-green-300 border border-green-500/40' 
          : 'bg-red-500/20 text-red-300 border border-red-500/40'
      }`}>
        {isSet ? '✓ Set' : '✗ Not Set'}
      </div>
    </div>
  );
}