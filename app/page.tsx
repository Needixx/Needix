// app/page.tsx
import Hero from '@/components/Hero';
import FeatureGrid from '@/components/FeatureGrid';
import CompareTable from '@/components/CompareTable';
import PricingTable from '@/components/PricingTable';
import FAQ from '@/components/FAQ';
import CTA from '@/components/CTA';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeatureGrid />
      <CompareTable />
      <PricingTable />
      <FAQ />
      <CTA />
    </main>
  );
}