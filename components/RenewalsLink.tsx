"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function RenewalsLink() {
  const { data: session } = useSession();
  const router = useRouter();

  function go(): void {
    if (session?.user) {
      router.push("/renewals");
    } else {
      // Avoid no-floating-promises
      void signIn("google", { callbackUrl: "/renewals" });
    }
  }

  return (
    <Button variant="secondary" onClick={go}>
      Renewals
    </Button>
  );
}
