"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function DashboardLink() {
  const { data: session } = useSession();
  const router = useRouter();

  function go() {
    if (session?.user) router.push("/dashboard");
    else signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <Button variant="secondary" onClick={go}>
      Dashboard
    </Button>
  );
}
