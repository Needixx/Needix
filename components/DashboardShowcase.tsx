// components/DashboardShowcase.tsx
import Image from 'next/image';

function shimmer(width: number, height: number) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#111827" offset="20%" />
        <stop stop-color="#1f2937" offset="50%" />
        <stop stop-color="#111827" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#0b0f1a"/>
    <rect id="r" width="${width}" height="${height}" fill="url(#g)"/>
    <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1.2s" repeatCount="indefinite"  />
  </svg>`;
}
const toBase64 = (str: string) =>
  typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str);

export default function DashboardShowcase() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-semibold text-white">A calm, organized dashboard</h3>
            <p className="mt-1 max-w-xl text-white/70">
              See renewals at a glance, get notified before charges, and spot overlaps fast.
            </p>
          </div>
          <div className="text-sm text-white/60">Demo preview</div>
        </div>

        {/* Aspect-ratio wrapper to avoid CLS */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10">
          <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
            <Image
              src="/dashboard-preview.png"
              alt="Needix dashboard preview"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1080px"
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(700, 394))}`}
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 text-sm text-white/70 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">🔔 Renewal alerts before charges</div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">📉 Price change notifications</div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">📦 Smart auto-reorder rules</div>
        </div>
      </div>
    </section>
  );
}
