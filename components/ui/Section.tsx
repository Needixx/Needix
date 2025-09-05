import type { ReactNode } from 'react';


export default function Section({ id, title, subtitle, children }: { id?: string; title: string; subtitle?: string; children: ReactNode; }) {
return (
<section id={id} className="mx-auto max-w-6xl px-4 py-16">
<header className="mb-8">
<h2 className="text-3xl font-semibold">{title}</h2>
{subtitle && <p className="mt-2 text-white/70">{subtitle}</p>}
</header>
{children}
</section>
);
}