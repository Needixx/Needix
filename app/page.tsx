// app/page.tsx
import FeatureGrid from '@/components/FeatureGrid';
import CompareTable from '@/components/CompareTable';
import PricingTable from '@/components/PricingTable';
import FAQ from '@/components/FAQ';
import CTA from '@/components/CTA';

export default function HomePage() {
  return (
    <main className="relative">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900 -z-10" />
      
      <FeatureGrid />
      <CompareTable />
      <PricingTable />
      <FAQ />
    </main>
  );
}