// components/DashboardLink.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function DashboardLink() {
  const { data: session } = useSession();
  const router = useRouter();

  function go() {
    if (session?.user) {
      router.push("/dashboard");
    } else {
      // Go to our custom sign-in page, not NextAuth's default
      router.push("/signin");
    }
  }

  return (
    <Button variant="secondary" onClick={go}>
      Dashboard
    </Button>
  );
}