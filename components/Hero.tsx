// components/Hero.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-24 text-center">
      {/* Background elements */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      
      <div className="relative mx-auto max-w-4xl">
        {/* Main headline */}
        <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Track Everything.
          </span>
          <br />
          <span className="text-white">Waste Nothing.</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-white/80 md:text-2xl">
          Your complete financial command center. Track subscriptions, manage orders, and monitor expenses—all in one beautiful dashboard.
        </p>

        {/* Feature highlights */}
        <div className="mb-10 flex flex-wrap justify-center gap-6 text-white/70">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-purple-500/20 p-2 text-purple-300">📺</span>
            <span>Subscription tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-cyan-500/20 p-2 text-cyan-300">📦</span>
            <span>Smart orders</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-green-500/20 p-2 text-green-300">💰</span>
            <span>Expense management</span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold hover:from-purple-700 hover:to-pink-700">
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
        <div className="mt-12 text-sm text-white/50">
          <p>✓ No credit card required • ✓ 30-day money back guarantee • ✓ Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}