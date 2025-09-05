import { Button } from '@/components/ui/Button';


export default function Hero() {
return (
<section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-16 md:grid-cols-2">
<div>
<h1 className="text-4xl font-semibold md:text-5xl">Never run out. Never overpay.</h1>
<p className="mt-4 text-white/70">Track subscriptions and auto‑reorder essentials from one simple dashboard.</p>
<div className="mt-6 flex gap-3">
<Button asChild><a href="/app">Get started</a></Button>
<Button asChild variant="secondary"><a href="#pricing">See pricing</a></Button>
</div>
<ul className="mt-6 space-y-2 text-white/70">
<li>• Smart reminders before renewals</li>
<li>• Predictive reorders with price ceilings</li>
<li>• Clean, mobile‑first design</li>
</ul>
</div>
<div className="rounded-3xl border border-white/10 p-6">
<div className="grid gap-3">
<div className="rounded-2xl border border-white/10 p-4">
<div className="flex items-center justify-between">
<span className="text-white/80">Netflix</span>
<span className="text-white/60">Renews in 12 days</span>
</div>
</div>
<div className="rounded-2xl border border-white/10 p-4">
<div className="flex items-center justify-between">
<span className="text-white/80">Coffee beans</span>
<span className="text-white/60">Reorder in 3 days</span>
</div>
</div>
</div>
</div>
</section>
);
}