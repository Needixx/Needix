// components/PricingTable.tsx
import Section from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import UpgradeButton from '@/components/UpgradeButton';

const rows = [
  { label: 'Tracked subscriptions', free: 'Up to 2', pro: 'Unlimited' },
  { label: 'Smart orders (auto-reorder rules)', free: 'Up to 2', pro: 'Unlimited' },
  { label: 'Expense categories', free: 'Up to 2', pro: 'Unlimited' },
  { label: 'Renewal reminders', free: 'Email', pro: 'Email + Browser + Mobile' },
  { label: 'Price change notifications', free: '—', pro: 'Included' },
  { label: 'CSV import / export', free: 'Import only', pro: 'Import + Export' },
  { label: 'Support', free: 'Community', pro: 'Priority' },
];

export default function PricingTable() {
  return (
    <Section
      id="pricing"
      title="Simple, transparent pricing"
      subtitle="Start free. Upgrade when you need more power."
    >
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        {/* Free */}
        <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h3 className="mb-1 text-xl font-semibold">Free</h3>
            <p className="mb-4 text-white/70">Perfect for getting started</p>
            <div className="mb-1 text-4xl font-extrabold">$0</div>
            <div className="text-white/60">Forever</div>
          </div>

          <ul className="mb-8 space-y-3 text-white/90">
            <li>• Track up to 2 subscriptions</li>
            <li>• 2 smart orders</li>
            <li>• 2 expense categories</li>
            <li>• Email renewal reminders</li>
          </ul>

          <Button className="w-full" variant="outline">
            Get Started Free
          </Button>
        </div>

        {/* Pro */}
        <div className="relative rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 p-8">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-1 text-sm font-medium text-white">
              Most Popular
            </span>
          </div>

          <div className="mb-6 text-center">
            <h3 className="mb-1 text-xl font-semibold">Pro</h3>
            <p className="mb-4 text-white/70">For serious financial tracking</p>
            <div className="mb-1 text-4xl font-extrabold">$5</div>
            <div className="text-white/60">per month</div>
          </div>

          <ul className="mb-8 space-y-3 text-white/90">
            <li>• Unlimited subscriptions, smart orders, and expenses</li>
            <li>• Email + browser + mobile reminders</li>
            <li>• Price change alerts</li>
            <li>• CSV import & export</li>
            <li>• Priority support</li>
          </ul>

          <UpgradeButton className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500">
            Upgrade to Pro
          </UpgradeButton>

          {/* Trust badges */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-white/70">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">30-day guarantee</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">Cancel anytime</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">Secure by design</div>
          </div>
        </div>
      </div>

      {/* Feature matrix (clarity at a glance) */}
      <div className="mx-auto mt-10 w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-sm md:text-base">
          <thead className="bg-white/5 text-white/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Feature</th>
              <th className="px-4 py-3 text-center font-semibold">Free</th>
              <th className="px-4 py-3 text-center font-semibold">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-white/[0.03]">
            {rows.map((r) => (
              <tr key={r.label} className="hover:bg-white/5">
                <td className="px-4 py-3 text-white/85">{r.label}</td>
                <td className="px-4 py-3 text-center text-white/70">{r.free}</td>
                <td className="px-4 py-3 text-center text-cyan-200">{r.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
