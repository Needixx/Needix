// app/layout.tsx
import type { ReactNode } from 'react';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import TimezoneBootstrap from '@/components/TimezoneBootstrap';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Needix - Track Everything. Waste Nothing.',
  description: 'Smart subscription tracking with price alerts and cancellation management',
  icons: { icon: '/favicon.ico' },
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

              {/* Clear the notch on small screens */}
              <div className="block sm:hidden h-safe-top" aria-hidden />

              <div className="ios-viewport-fix flex min-h-screen flex-col">
                <Navbar />

                {/* Hefty bottom padding so the page can always scroll footer above Safari’s toolbar */}
                <main className="mobile-scroll flex-1 pb-[calc(env(safe-area-inset-bottom)+160px)] md:pb-0">
                  {children}
                </main>

                <Footer />
              </div>

              {/* MOBILE-ONLY BUMPER AFTER THE FOOTER.
                  This pushes the document’s hard-stop *below* the footer no matter what. */}
              <div className="block sm:hidden h-[200px]" aria-hidden />
            </ClientLayoutWrapper>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
