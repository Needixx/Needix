import type { ReactNode } from "react";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        <SessionProvider>
          <Navbar />
          {/* spacer equal to navbar height (adjust if you tweak Navbar padding) */}
          <div className="h-14" />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
