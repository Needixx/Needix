// app/calendar/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CalendarClient from "@/components/CalendarClient";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <main className="relative min-h-screen">
      {/* Futuristic Background */}
      <div className="fixed inset-0 bg-black -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-orange-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-orange-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-yellow-500/4 to-transparent -z-10" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-8">
        <CalendarClient />
      </div>
    </main>
  );
}