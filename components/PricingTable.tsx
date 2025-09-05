import Section from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';


export default function PricingTable() {
return (
<Section id="pricing" title="Simple pricing" subtitle="Start free. Upgrade anytime.">
<div className="grid gap-4 md:grid-cols-2">
<div className="rounded-2xl border border-white/10 p-6">
<h3 className="text-xl font-semibold">Free</h3>
<p className="mt-2 text-white/70">Track up to 3 subscriptions and 2 reorders.</p>
<ul className="mt-4 space-y-2 text-white/70">
<li>• Manual tracking</li>
<li>• Basic reminders</li>
</ul>
<Button asChild className="mt-6 w-full"><a href="/app">Get started</a></Button>
</div>
<div className="rounded-2xl border border-white/10 p-6">
<h3 className="text-xl font-semibold">Pro</h3>
<p className="mt-2 text-white/70">Unlimited + smart reorders.</p>
<ul className="mt-4 space-y-2 text-white/70">
<li>• Unlimited items</li>
<li>• Predictive alerts</li>
<li>• Price ceilings</li>
</ul>
<Button asChild className="mt-6 w-full"><a href="/app">Upgrade inside app</a></Button>
</div>
</div>
</Section>
);
}