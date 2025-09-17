import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UpcomingRenewals from "@/components/UpcomingRenewals";

export default async function RenewalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Upcoming Renewals</h1>
      <p className="mb-6 text-white/70">See renewals within a chosen window and take quick actions.</p>
      <UpcomingRenewals />
    </main>
  );
}

