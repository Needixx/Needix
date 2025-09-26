// app/dashboard/layout.tsx
import { AuthWrapper } from "@/components/AuthWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {children}
      </div>
    </AuthWrapper>
  );
}