// components/integrations/PlaidLink.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create link token");
        }

        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (error: any) {
        console.error("Error fetching link token:", error);
        toast(error.message || "Failed to initialize bank connection", "error");
      }
    };

    fetchLinkToken();
  }, []);

  const onPlaidSuccess = useCallback(async (public_token: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/plaid/exchange-public-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to connect bank account");
      }

      const data = await response.json();
      toast(
        `Successfully connected! Found ${data.accounts} account(s) and ${data.transactions} transaction(s).`,
        "success"
      );
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error exchanging public token:", error);
      toast(error.message || "Failed to connect bank account", "error");
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      if (err) {
        console.error("Plaid Link exited with error:", err);
        toast("Bank connection cancelled", "info");
      }
    },
  });

  return (
    <Button
      onClick={() => open()}
      disabled={!ready || loading || !linkToken}
      className="w-full"
    >
      {loading ? "Connecting..." : "Connect Bank Account"}
    </Button>
  );
}
