// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    /**
     * Mobile behavior:
     *  - pb-safe-bottom: comfortable tap area _inside_ footer
     *  - mb-[calc(...+96px)]: adds extra space _after_ footer so the page’s
     *    "hard stop" is lower than the footer → footer sits higher and stays visible
     */
    <footer className="border-t border-white/10 pb-safe-bottom md:pb-8 mb-[calc(env(safe-area-inset-bottom)+96px)] md:mb-0">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
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
    </footer>
  );
}
