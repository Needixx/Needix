import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>

      <section className="mb-6 rounded-2xl border border-white/10 p-6">
        <h2 className="mb-2 text-lg font-medium">Profile</h2>
        <p className="mb-4 text-white/70">
          Manage your display name, avatar, and contact email.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm text-white/70">Name</span>
            <input
              className="rounded-xl border border-white/10 bg-transparent px-3 py-2 outline-none"
              placeholder={session.user?.name ?? ""}
              disabled
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-white/70">Email</span>
            <input
              className="rounded-xl border border-white/10 bg-transparent px-3 py-2 outline-none"
              placeholder={session.user?.email ?? ""}
              disabled
            />
          </label>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-white/10 p-6">
        <h2 className="mb-2 text-lg font-medium">Notifications</h2>
        <p className="mb-4 text-white/70">
          Choose when we notify you about renewals and reorders.
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input type="checkbox" disabled className="h-4 w-4" />
            <span>Renewal reminders (placeholder)</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" disabled className="h-4 w-4" />
            <span>Price change alerts (placeholder)</span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 p-6">
        <h2 className="mb-2 text-lg font-medium">Danger zone</h2>
        <p className="mb-4 text-white/70">
          Export your data or delete your account (coming soon).
        </p>
        <button className="rounded-xl border border-red-500/30 px-4 py-2 text-red-400/90 hover:bg-red-500/10" disabled>
          Delete account (disabled)
        </button>
      </section>
    </main>
  );
}
