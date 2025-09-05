import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Your Subscriptions</h1>
      <p className="mb-8 text-white/70">Add, modify, and import your subscriptions here.</p>
      <DashboardClient />
    </main>
  );
}
