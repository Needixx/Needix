export default function Footer() {
return (
<footer className="border-t border-white/10">
<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
<p className="text-white/60">© {new Date().getFullYear()} Needix</p>
<div className="flex gap-4 text-white/70">
<a href="#pricing">Pricing</a>
<a href="#faq">FAQ</a>
<a href="#">Privacy</a>
<a href="#">Terms</a>
</div>
</div>
</footer>
);
}