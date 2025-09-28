// components/settings/SecuritySettings.tsx
"use client";

import { useState, useEffect } from "react";
import { SettingsSecuritySettings as SecuritySettingsType } from "@/components/settings/types";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import TwoFactorVerification from "@/components/auth/TwoFactorVerification";

interface SecuritySettingsProps {
  security: SecuritySettingsType;
  setSecurity: React.Dispatch<React.SetStateAction<SecuritySettingsType>>;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

export default function SecuritySettings({ security, setSecurity }: SecuritySettingsProps) {
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingAction, setPendingAction] = useState<'enable' | 'disable' | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Get user email on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handle2FAToggle = async (enable: boolean) => {
    if (enable && !security.twoFactorEnabled) {
      setPendingAction('enable');
      await sendVerificationCode();
    } else if (!enable && security.twoFactorEnabled) {
      setPendingAction('disable');
      await sendVerificationCode();
    }
  };

  const sendVerificationCode = async () => {
    setIsLoading(true);
    try {
      if (!userEmail) {
        toast("Unable to get user email", "error");
        return;
      }

      const result = await fetch('/api/auth/2fa/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
        }),
      });

      const data = await result.json();
      console.log('Send code response:', data);

      if (data.success) {
        setShowVerification(true);
        toast("Verification code sent to your email", "success");
      } else {
        toast(data.error || "Failed to send verification code", "error");
      }
    } catch (error) {
      toast("Failed to send verification code", "error");
      console.error('Send verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCodeAndToggle2FA = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Verifying code:', code);
      
      // Verify the code first
      const verifyResponse = await fetch('/api/auth/2fa/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(), // Remove any whitespace
        }),
      });

      const verifyData = await verifyResponse.json();
      console.log('Verify response:', verifyData);

      if (!verifyData.success) {
        return { success: false, error: verifyData.error };
      }

      // Code verified, now toggle 2FA
      const enableResponse = await fetch('/api/auth/2fa/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enable: pendingAction === 'enable',
        }),
      });

      const enableData = await enableResponse.json();

      if (enableData.success) {
        setSecurity(prev => ({
          ...prev,
          twoFactorEnabled: pendingAction === 'enable'
        }));
        
        setShowVerification(false);
        setPendingAction(null);
        
        toast(
          pendingAction === 'enable' 
            ? "Two-factor authentication enabled successfully!" 
            : "Two-factor authentication disabled successfully!",
          "success"
        );
        
        return { success: true };
      } else {
        return { success: false, error: enableData.error };
      }
    } catch (error) {
      console.error('Verification error:', error);
      return { success: false, error: "Network error occurred" };
    }
  };

  const resendVerificationCode = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await fetch('/api/auth/2fa/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
        }),
      });

      const data = await result.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      return { success: false, error: "Failed to resend code" };
    }
  };

  const handleCancelVerification = () => {
    setShowVerification(false);
    setPendingAction(null);
  };

  const handleViewActiveSessions = () => {
    toast("Active sessions management coming soon!", "info");
  };

  // Show verification modal if needed
  if (showVerification) {
    return (
      <TwoFactorVerification
        email={userEmail}
        onVerify={verifyCodeAndToggle2FA}
        onResendCode={resendVerificationCode}
        onCancel={handleCancelVerification}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🔒 Security</h2>
        <p className="text-white/60">Protect your account with advanced security features</p>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">🔐 Two-Factor Authentication</h3>
            <p className="text-sm text-white/60 mt-1">Add an extra layer of security to your account</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${security.twoFactorEnabled ? "text-green-400" : "text-white/60"}`}>
              {security.twoFactorEnabled ? "✓ Enabled" : "Disabled"}
            </span>
            <Button 
              onClick={() => handle2FAToggle(!security.twoFactorEnabled)}
              disabled={isLoading || !userEmail}
              variant={security.twoFactorEnabled ? "secondary" : "primary"} 
              size="sm"
            >
              {isLoading ? "Loading..." : security.twoFactorEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>

        {security.twoFactorEnabled ? (
          <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400">✓</span>
              <span className="font-medium text-green-400">Two-Factor Authentication Enabled</span>
            </div>
            <p className="text-sm text-green-300">
              Your account is protected with email-based two-factor authentication. You'll need to enter a code 
              sent to your email when signing in from new devices.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400">⚠️</span>
              <span className="font-medium text-yellow-400">Two-Factor Authentication Disabled</span>
            </div>
            <p className="text-sm text-yellow-300">
              Your account is less secure without two-factor authentication. Enable it to protect against unauthorized
              access even if someone knows your password.
            </p>
          </div>
        )}
      </div>

      {/* Rest of the component remains the same... */}
      {/* Active Sessions */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">📱 Active Sessions</h3>
            <p className="text-sm text-white/60 mt-1">Monitor devices and browsers signed into your account</p>
          </div>
          <Button onClick={handleViewActiveSessions} variant="secondary" size="sm">
            View All Sessions
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple to-cyan rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🖥️</span>
              </div>
              <div>
                <div className="font-medium text-white">Current Session</div>
                <div className="text-sm text-white/60">Chrome on Windows • Colorado Springs, US</div>
              </div>
            </div>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Active Now</span>
          </div>

          <div className="text-center py-4">
            <div className="text-2xl font-bold text-white">{security.activeSessions}</div>
            <div className="text-sm text-white/60">Active Sessions</div>
          </div>
        </div>
      </div>

      {/* Security Checklist */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">✅ Security Checklist</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-green-400">✓</span>
            <span className="text-white">Strong password set</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <span className={security.twoFactorEnabled ? "text-green-400" : "text-red-400"}>
              {security.twoFactorEnabled ? "✓" : "✗"}
            </span>
            <span className="text-white">Two-factor authentication enabled</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-green-400">✓</span>
            <span className="text-white">Email verified</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-green-400">✓</span>
            <span className="text-white">Account recovery email set</span>
          </div>
        </div>

        {/* Security Score */}
        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-white">Security Score</span>
            <span className={`font-bold ${
              security.twoFactorEnabled ? "text-green-400" : "text-yellow-400"
            }`}>
              {security.twoFactorEnabled ? "100%" : "75%"}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                security.twoFactorEnabled 
                  ? "bg-green-500 w-full" 
                  : "bg-yellow-500 w-3/4"
              }`}
            />
          </div>
          <p className="text-xs text-white/60 mt-2">
            {security.twoFactorEnabled 
              ? "Excellent! Your account is fully secured." 
              : "Good security, but enabling 2FA would make it even better."
            }
          </p>
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">💡 Security Tips</h3>
        <div className="space-y-3 text-sm text-white/80">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>Use a unique, strong password that you don't use elsewhere</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>Enable two-factor authentication for maximum security</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>Regularly review your active sessions and sign out unused devices</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>Never share your login credentials or verification codes with anyone</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">•</span>
            <span>Be cautious when accessing your account on public or shared computers</span>
          </div>
        </div>
      </div>
    </div>
  );
}