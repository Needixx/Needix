import { IntegrationSettings } from "@/components/settings/types";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface IntegrationsSettingsProps {
  integrations: IntegrationSettings;
  setIntegrations: React.Dispatch<React.SetStateAction<IntegrationSettings>>;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

export default function IntegrationsSettings({ integrations, setIntegrations }: IntegrationsSettingsProps) {
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);

  const updateIntegrations = (updates: Partial<IntegrationSettings>) => {
    const newSettings = { ...integrations, ...updates };
    setIntegrations(newSettings);
    localStorage.setItem("needix_integrations", JSON.stringify(newSettings));
    toast("Integration settings updated", "success");
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/signin/google";
  };

  const handleDisconnectGoogle = () => {
    updateIntegrations({ googleConnected: false });
    toast("Google account disconnected", "success");
  };

  const handleSubscribePush = async () => {
    if (!integrations.webPushSupported) {
      toast("Web Push not supported in this browser", "error");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast("Push notifications enabled!", "success");
      } else {
        toast("Permission denied for push notifications", "error");
      }
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast("Failed to enable push notifications", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🔗 Integrations</h2>
        <p className="text-white/60">Connect external services to enhance your Needix experience</p>
      </div>

      {/* Google Integration */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Google Account</h3>
              <p className="text-sm text-white/60">Connect to import subscription data from Gmail</p>
            </div>
          </div>
          {integrations.googleConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm">✓ Connected</span>
              <Button onClick={handleDisconnectGoogle} variant="secondary" size="sm">
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnectGoogle} variant="primary" size="sm">
              Connect Google
            </Button>
          )}
        </div>

        {integrations.googleConnected ? (
          <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400">✓</span>
              <span className="font-medium text-green-400">Google Account Connected</span>
            </div>
            <p className="text-sm text-green-300">
              We can now automatically detect new subscriptions from your Gmail receipts.
            </p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Benefits of connecting Google:</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Automatically detect subscription emails</li>
              <li>• Import existing subscription data</li>
              <li>• Track price changes from receipts</li>
              <li>• Sync cancellation confirmations</li>
            </ul>
          </div>
        )}
      </div>

      {/* Push Notifications */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple to-cyan rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🔔</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Web Push Notifications</h3>
              <p className="text-sm text-white/60">Receive notifications even when the app is closed</p>
            </div>
          </div>
          {integrations.webPushSupported ? (
            <Button onClick={() => { void handleSubscribePush(); }} variant="primary" size="sm">
              Subscribe to Push
            </Button>
          ) : (
            <span className="text-red-400 text-sm">Not Supported</span>
          )}
        </div>

        {integrations.webPushSupported ? (
          <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400">ℹ️</span>
              <span className="font-medium text-blue-400">Push Notifications Available</span>
            </div>
            <p className="text-sm text-blue-300">
              Enable push notifications to receive renewal reminders and price alerts 
              even when Needix isn't open in your browser.
            </p>
          </div>
        ) : (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">⚠️</span>
              <span className="font-medium text-red-400">Push Notifications Not Supported</span>
            </div>
            <p className="text-sm text-red-300">
              Your browser doesn't support web push notifications. 
              Try using Chrome, Firefox, or Safari for the best experience.
            </p>
          </div>
        )}
      </div>

      {/* Coming Soon */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🚀 Coming Soon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg opacity-60">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📧</span>
              <span className="font-medium text-white">Email Integration</span>
            </div>
            <p className="text-sm text-white/60">Connect your email to automatically track subscriptions</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg opacity-60">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏦</span>
              <span className="font-medium text-white">Bank Sync</span>
            </div>
            <p className="text-sm text-white/60">Automatically import transactions from your bank</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg opacity-60">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💳</span>
              <span className="font-medium text-white">Credit Card Sync</span>
            </div>
            <p className="text-sm text-white/60">Track subscriptions from your credit card statements</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg opacity-60">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📱</span>
              <span className="font-medium text-white">Mobile App</span>
            </div>
            <p className="text-sm text-white/60">Native iOS and Android apps with push notifications</p>
          </div>
        </div>
      </div>
    </div>
  );
}
