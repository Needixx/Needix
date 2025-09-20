// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OfflineIndicator from "@/components/OfflineIndicator";
import { ToastProvider } from "@/components/ui/Toast";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Needix - Track Everything. Waste Nothing.',
  description:
    'Smart subscription tracking with price alerts and cancellation management',
  icons: { icon: '/favicon.ico' },
  // ❌ no `viewport` here
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  // optional but nice for mobile status bar color:
  // themeColor: '#000000',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="ios-viewport-fix">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-screen bg-black text-white antialiased mobile-no-select">
        <SessionProvider>
          <ToastProvider>
            <ClientLayoutWrapper>
              <div className="flex flex-col min-h-screen ios-viewport-fix">
                <OfflineIndicator />
                <Navbar />
                <main className="flex-1 mobile-scroll">
                  {children}
                </main>
                <Footer />
              </div>
            </ClientLayoutWrapper>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}