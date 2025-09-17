import clsx from 'clsx';


export default function DashboardTabs({ value, onChange }: { value: 'subscriptions' | 'reorders' | 'settings'; onChange: (v: 'subscriptions' | 'reorders' | 'settings') => void; }) {
const tabs: Array<{ key: typeof value; label: string }> = [
{ key: 'subscriptions', label: 'Subscriptions' },
{ key: 'reorders', label: 'Reorders' },
{ key: 'settings', label: 'Settings' },
];
return (
<div className="mb-6 inline-flex rounded-2xl border border-white/10 p-1">
{tabs.map((t) => (
<button key={t.key} onClick={() => onChange(t.key)} className={clsx('rounded-xl px-4 py-2 text-sm', value === t.key ? 'bg-white text-black' : 'text-white/80')}>
{t.label}
</button>
))}
</div>
);
}