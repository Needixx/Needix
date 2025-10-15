// components/Hero.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-24 text-center md:py-28">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
          <span>🔔</span> Renewal alerts • Price change notifications • CSV import
        </span>

        <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            Track Everything.
          </span>
          <br />
          <span className="text-white">Waste Nothing.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl">
          Needix is your financial command center. See every subscription, smart reorder, and expense — with reminders before you get charged again.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold hover:from-purple-700 hover:to-pink-700"
            >
              Start Free Today
            </Button>
          </Link>
          <Link href="/how-it-works">
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
              See How It Works
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
          <span>✓ No credit card required</span>
          <span className="text-white/25">•</span>
          <span>✓ Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}
