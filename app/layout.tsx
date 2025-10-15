// app/layout.tsx
import type { ReactNode } from 'react';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OfflineIndicator from '@/components/OfflineIndicator';
import { ToastProvider } from '@/components/ui/Toast';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import TimezoneBootstrap from '@/components/TimezoneBootstrap';
import StickyCTA from '@/components/StickyCTA';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Needix - Track Everything. Waste Nothing.',
  description:
    'Smart subscription tracking with price alerts and cancellation management',
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="ios-viewport-fix">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="mobile-no-select min-h-screen bg-black text-white antialiased">
        <SessionProvider>
          <ToastProvider>
            <ClientLayoutWrapper>
              <TimezoneBootstrap />

              {/* Top safe-area spacer for iOS status bar on small screens */}
              <div className="block sm:hidden h-safe-top" aria-hidden />

              <div className="ios-viewport-fix flex min-h-screen flex-col">
                <Navbar />
                {/* Add bottom safe padding so footer content can scroll above iOS Safari toolbar */}
                <main className="mobile-scroll flex-1 pb-safe-bottom">
                  {children}
                </main>
                <Footer />
              </div>

              {/* Bottom safe-area spacer ensures you can overscroll just enough to reveal footer above Safari bar */}
              <div className="block sm:hidden h-safe-bottom" aria-hidden />

              {/* Subtle sticky CTA to improve conversion */}
              {/* <StickyCTA /> */}
            </ClientLayoutWrapper>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
