"use client";
import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");

  return (
    <main className="mx-auto grid max-w-md gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-white/70">Use Google to continue.</p>

      <div className="grid gap-3">
        <Button onClick={() => signIn("google", { callbackUrl: "/app" })}>
          Continue with Google
        </Button>

        {/* (Optional) Keep this for future Email login */}
        <div className="rounded-2xl border border-white/10 p-4 text-left">
          <label className="mb-2 block text-sm text-white/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 outline-none"
          />
          <Button className="mt-3 w-full" onClick={() => signIn("email", { email })}>
            Send magic link
          </Button>
        </div>
      </div>
    </main>
  );
}
