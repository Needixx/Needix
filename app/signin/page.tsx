// app/signin/page.tsx
import { Suspense } from "react";
import ClientSignInForm from "@/components/ClientSignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70">Loading...</p>
          </div>
        </div>
      }>
        <ClientSignInForm />
      </Suspense>
    </div>
  );
}