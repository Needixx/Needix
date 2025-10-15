// app/page.tsx
import Hero from '@/components/Hero';
import FeatureGrid from '@/components/FeatureGrid';
import CompareTable from '@/components/CompareTable';
import PricingTable from '@/components/PricingTable';
import FAQ from '@/components/FAQ';
import SocialProof from '@/components/SocialProof';
import DashboardShowcase from '@/components/DashboardShowcase';

export default function HomePage() {
  return (
    <main className="relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-purple-950/25 to-slate-950" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/25 via-slate-950 to-slate-950" />

      {/* 1) Stronger hero hierarchy */}
      <Hero />

      {/* 2) Social proof near the top to build trust fast */}
      <SocialProof />

      {/* 1) Maintain scannable rhythm with section intros */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16">
        <h2 className="mb-4 text-center text-2xl font-bold tracking-tight text-white/95">
          Everything you need to stop money leaks
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-white/60">
          See subscriptions, orders, and expenses in one calm place — with smart alerts before renewals and clear totals that actually make sense.
        </p>
      </section>

      <FeatureGrid />

      {/* 2) Show, don’t tell — product preview */}
      <DashboardShowcase />

      {/* 3) Pricing with built-in feature matrix + trust badges */}
      <PricingTable />

      {/* 4) Concrete, accessible FAQ */}
      <FAQ />
    </main>
  );
}
