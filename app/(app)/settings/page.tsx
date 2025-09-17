// app/(app)/settings/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          ⚙️ Settings
        </h1>
        <p className="text-white/60 mt-1">Manage your account preferences and data</p>
      </div>

      <SettingsClient user={session.user} />
    </main>
  );
}