import { Button } from '@/components/ui/Button';


export default function CTA() {
return (
<section className="mx-auto max-w-6xl px-4 py-16">
<div className="rounded-3xl border border-white/10 p-8 text-center">
<h3 className="text-2xl font-semibold">Ready to simplify your life?</h3>
<p className="mt-2 text-white/70">It takes 60 seconds to add your first two items.</p>
<div className="mt-6 flex justify-center">
<Button asChild><a href="/app">Open the app</a></Button>
</div>
</div>
</section>
);
}