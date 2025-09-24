import { SettingsSecuritySettings as SecuritySettingsType } from "@/components/settings/types";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface SecuritySettingsProps {
  security: SecuritySettingsType;
  setSecurity: React.Dispatch<React.SetStateAction<SecuritySettingsType>>;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

export default function SecuritySettings({ security /* , setSecurity */ }: SecuritySettingsProps) {
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);

  const handleEnable2FA = () => {
    toast("Two-factor authentication setup coming soon!", "info");
  };

  const handleViewActiveSessions = () => {
    toast("Active sessions management coming soon!", "info");
  };

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
            <Button onClick={handleEnable2FA} variant={security.twoFactorEnabled ? "secondary" : "primary"} size="sm">
              {security.twoFactorEnabled ? "Manage" : "Enable"}
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
              Your account is protected with two-factor authentication. You'll need to enter a code from your
              authenticator app when signing in.
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
              access.
            </p>
          </div>
        )}
      </div>

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
        </div>
      </div>
    </div>
  );
}
