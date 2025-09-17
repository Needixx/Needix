import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardTabsBar from "@/components/DashboardTabsBar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <DashboardTabsBar />
      {children}
    </div>
  );
}

