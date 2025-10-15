// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    /**
     * Keep the footer anchored at the bottom, but push its CONTENT upward on mobile:
     *  - pb-safe-bottom: ensures inner content isn’t under the home bar / toolbar
     *  - md:hidden h-[120px] spacer INSIDE the footer adds blank space below the links
     *    so links appear higher (visible above Safari’s toolbar) without changing layout height.
     */
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row pb-safe-bottom">
        <p className="text-white/60">© {year} Needix</p>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-4 text-white/70">
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link>
          <Link href="/how-it-works" className="hover:text-white transition-colors">How it works</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </nav>
      </div>

      {/* Mobile-only internal spacer: pushes visible links upward while footer stays at bottom */}
      <div className="md:hidden h-[120px]" aria-hidden />
    </footer>
  );
}
