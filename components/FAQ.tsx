import Section from '@/components/ui/Section';


export default function FAQ() {
const faqs = [
{ q: 'Do I need to connect my bank?', a: 'No. Start manually and connect later if you want extra automation.' },
{ q: 'Can you auto‑order for me?', a: 'MVP sends reminders with one‑tap links. Full automation comes later via vendor APIs.' },
{ q: 'How do price ceilings work?', a: 'You set a max price. We only prompt to reorder if the current price is under it.' },
];
return (
<Section id="faq" title="FAQ" subtitle="Quick answers to common questions.">
<div className="grid gap-4 md:grid-cols-2">
{faqs.map((item) => (
<div key={item.q} className="rounded-2xl border border-white/10 p-6">
<h3 className="text-lg font-semibold">{item.q}</h3>
<p className="mt-2 text-white/70">{item.a}</p>
</div>
))}
</div>
</Section>
);
}