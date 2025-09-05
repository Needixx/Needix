import Section from '@/components/ui/Section';


export default function FeatureGrid() {
const features = [
{ title: 'All your subscriptions, one view', desc: 'Add Netflix, Spotify, iCloud, and more. Get alerts before they renew.' },
{ title: 'Auto‑reorder essentials', desc: 'Set frequency and price ceilings for coffee, detergent, pet food, etc.' },
{ title: 'Predictive reminders', desc: 'We estimate when you’ll run out based on past orders.' },
{ title: 'Privacy‑first', desc: 'Start manually. Connect banks later if you want (Plaid optional).' },
];
return (
<Section id="features" title="Features" subtitle="Focused. Not bloated.">
<div className="grid gap-4 md:grid-cols-2">
{features.map((f) => (
<div key={f.title} className="rounded-2xl border border-white/10 p-6">
<h3 className="text-xl font-semibold">{f.title}</h3>
<p className="mt-2 text-white/70">{f.desc}</p>
</div>
))}
</div>
</Section>
);
}