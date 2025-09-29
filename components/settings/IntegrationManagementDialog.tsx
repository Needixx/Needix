// components/settings/IntegrationManagementDialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface IntegrationManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  integrationType: "webhooks" | "slack" | "discord" | null;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

export default function IntegrationManagementDialog({ 
  isOpen, 
  onClose, 
  integrationType 
}: IntegrationManagementDialogProps) {
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);
  
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "subscription.created",
    "subscription.renewed",
    "price.changed"
  ]);

  const [slackWebhook, setSlackWebhook] = useState("");
  const [slackChannel, setSlackChannel] = useState("#general");

  const [discordWebhook, setDiscordWebhook] = useState("");

  if (!isOpen || !integrationType) return null;

  const availableEvents = [
    { id: "subscription.created", label: "New subscription added", description: "When a subscription is manually added or auto-detected" },
    { id: "subscription.updated", label: "Subscription modified", description: "When subscription details are changed" },
    { id: "subscription.deleted", label: "Subscription removed", description: "When a subscription is deleted" },
    { id: "subscription.renewed", label: "Subscription renewed", description: "When a subscription payment is processed" },
    { id: "price.changed", label: "Price change detected", description: "When a subscription price increases/decreases" },
    { id: "payment.due", label: "Payment due soon", description: "Upcoming payment reminders" },
    { id: "payment.failed", label: "Payment failed", description: "When a payment fails or is declined" }
  ];

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl) {
      toast("Please enter a webhook URL", "error");
      return;
    }

    if (selectedEvents.length === 0) {
      toast("Please select at least one event", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/integrations/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          events: selectedEvents,
          secret: webhookSecret || undefined
        })
      });

      if (response.ok) {
        toast("Webhook configured successfully!", "success");
        onClose();
      } else {
        const { error } = await response.json();
        toast(error || "Failed to configure webhook", "error");
      }
    } catch (error) {
      console.error("Error saving webhook:", error);
      toast("Failed to save webhook configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlack = async () => {
    if (!slackWebhook) {
      toast("Please enter your Slack webhook URL", "error");
      return;
    }

    setLoading(true);
    try {
      // Test Slack webhook
      const testMessage = {
        text: "🎉 Needix integration successfully configured!",
        channel: slackChannel,
        username: "Needix",
        icon_emoji: ":moneybag:"
      };

      const response = await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testMessage)
      });

      if (response.ok) {
        toast("Slack integration configured successfully!", "success");
        onClose();
      } else {
        toast("Failed to connect to Slack. Please check your webhook URL.", "error");
      }
    } catch (error) {
      console.error("Error testing Slack webhook:", error);
      toast("Failed to configure Slack integration", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiscord = async () => {
    if (!discordWebhook) {
      toast("Please enter your Discord webhook URL", "error");
      return;
    }

    setLoading(true);
    try {
      // Test Discord webhook
      const testMessage = {
        content: "🎉 **Needix integration successfully configured!**\nYou'll now receive subscription notifications in this channel.",
        username: "Needix",
        avatar_url: "https://needix.app/icon.png"
      };

      const response = await fetch(discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testMessage)
      });

      if (response.ok) {
        toast("Discord integration configured successfully!", "success");
        onClose();
      } else {
        toast("Failed to connect to Discord. Please check your webhook URL.", "error");
      }
    } catch (error) {
      console.error("Error testing Discord webhook:", error);
      toast("Failed to configure Discord integration", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderWebhookConfig = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Configure Custom Webhook</h3>
        <p className="text-white/60 text-sm mb-4">
          Send subscription data to your own systems via HTTP webhooks.
        </p>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Webhook URL *</label>
        <input
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-app.com/webhooks/needix"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-white/50 text-xs mt-1">
          We'll send POST requests to this URL when events occur
        </p>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Secret (Optional)</label>
        <input
          type="password"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          placeholder="Optional signing secret"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-white/50 text-xs mt-1">
          Used to verify webhook authenticity via X-Needix-Signature header
        </p>
      </div>

      <div>
        <label className="block text-white font-medium mb-3">Events to Subscribe *</label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {availableEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <input
                type="checkbox"
                id={event.id}
                checked={selectedEvents.includes(event.id)}
                onChange={() => handleEventToggle(event.id)}
                className="mt-1 w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
              />
              <div className="flex-1">
                <label htmlFor={event.id} className="text-white font-medium cursor-pointer">
                  {event.label}
                </label>
                <p className="text-white/60 text-sm">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
        <h4 className="font-medium text-blue-300 mb-2">Webhook Payload Example:</h4>
        <pre className="text-xs text-blue-200 bg-blue-900/30 p-3 rounded overflow-x-auto">
{`{
  "event": "subscription.renewed",
  "data": {
    "id": "sub_123",
    "name": "Netflix",
    "price": 15.49,
    "currency": "USD",
    "next_date": "2025-11-28"
  },
  "timestamp": "2025-09-28T10:30:00Z",
  "userId": "user_456"
}`}
        </pre>
      </div>

      <div className="flex gap-3">
        <Button onClick={onClose} variant="secondary" className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSaveWebhook} 
          disabled={loading}
          variant="primary" 
          className="flex-1"
        >
          {loading ? "Testing..." : "Save & Test Webhook"}
        </Button>
      </div>
    </div>
  );

  const renderSlackConfig = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Configure Slack Integration</h3>
        <p className="text-white/60 text-sm mb-4">
          Get subscription notifications directly in your Slack workspace.
        </p>
      </div>

      <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
        <h4 className="font-medium text-yellow-300 mb-2">Setup Instructions:</h4>
        <ol className="text-yellow-200 text-sm space-y-1 list-decimal list-inside">
          <li>Go to your Slack App settings</li>
          <li>Create a new Incoming Webhook</li>
          <li>Select the channel for notifications</li>
          <li>Copy the webhook URL and paste it below</li>
        </ol>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Slack Webhook URL *</label>
        <input
          type="url"
          value={slackWebhook}
          onChange={(e) => setSlackWebhook(e.target.value)}
          placeholder="https://hooks.slack.com/services/..."
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Channel</label>
        <input
          type="text"
          value={slackChannel}
          onChange={(e) => setSlackChannel(e.target.value)}
          placeholder="#general"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={onClose} variant="secondary" className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSaveSlack} 
          disabled={loading}
          variant="primary" 
          className="flex-1"
        >
          {loading ? "Testing..." : "Save & Test Integration"}
        </Button>
      </div>
    </div>
  );

  const renderDiscordConfig = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Configure Discord Integration</h3>
        <p className="text-white/60 text-sm mb-4">
          Get subscription notifications in your Discord server.
        </p>
      </div>

      <div className="bg-purple-500/20 border border-purple-500/40 rounded-lg p-4">
        <h4 className="font-medium text-purple-300 mb-2">Setup Instructions:</h4>
        <ol className="text-purple-200 text-sm space-y-1 list-decimal list-inside">
          <li>Go to your Discord server settings</li>
          <li>Navigate to Integrations → Webhooks</li>
          <li>Create a new webhook for your desired channel</li>
          <li>Copy the webhook URL and paste it below</li>
        </ol>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Discord Webhook URL *</label>
        <input
          type="url"
          value={discordWebhook}
          onChange={(e) => setDiscordWebhook(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={onClose} variant="secondary" className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSaveDiscord} 
          disabled={loading}
          variant="primary" 
          className="flex-1"
        >
          {loading ? "Testing..." : "Save & Test Integration"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {integrationType === "webhooks" && renderWebhookConfig()}
          {integrationType === "slack" && renderSlackConfig()}
          {integrationType === "discord" && renderDiscordConfig()}
        </div>
      </div>
    </div>
  );
}