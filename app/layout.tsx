// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OfflineIndicator from "@/components/OfflineIndicator";
import { ToastProvider } from "@/components/ui/Toast";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

export const metadata = {
  title: "Needix - Track Everything. Waste Nothing.",
  description: "Smart subscription tracking with price alerts and cancellation management",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        <SessionProvider>
          <ToastProvider>
            <ClientLayoutWrapper>
              <OfflineIndicator />
              <Navbar />
              {children}
              <Footer />
            </ClientLayoutWrapper>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}