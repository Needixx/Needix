import Section from '@/components/ui/Section';


export default function CompareTable() {
return (
<Section title="Needix vs finance apps" subtitle="We focus on convenience, not bloat.">
<div className="overflow-x-auto rounded-2xl border border-white/10">
<table className="w-full text-left">
<thead className="bg-white/5">
<tr>
<th className="px-4 py-3">Feature</th>
<th className="px-4 py-3">Needix</th>
<th className="px-4 py-3">Finance Suites</th>
</tr>
</thead>
<tbody>
{[
['Subscription alerts', '✅', '✅'],
['Auto‑reorder essentials', '✅', '❌'],
['Price ceiling on reorders', '✅', '❌'],
['Simple, mobile‑first', '✅', '⚠️'],
].map((row) => (
<tr key={row[0]} className="border-t border-white/10">
{row.map((cell, i) => (
<td key={i} className="px-4 py-3 text-white/80">{cell}</td>
))}
</tr>
))}
</tbody>
</table>
</div>
</Section>
);
}