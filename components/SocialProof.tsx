// components/SocialProof.tsx
export default function SocialProof() {
  return (
    <section className="px-4 pt-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white/70 backdrop-blur sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-sm uppercase tracking-widest text-white/40">Trusted by early users</p>
          <p className="mt-1 text-white/80">
            “Canceled two forgotten subs in a week. Needix paid for itself.”
            <span className="text-white/40"> — Beta user</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-white/50">
          <div className="rounded-md border border-white/10 px-3 py-1 text-xs">Personal Finance</div>
          <div className="rounded-md border border-white/10 px-3 py-1 text-xs">Students</div>
          <div className="rounded-md border border-white/10 px-3 py-1 text-xs">SaaS Founders</div>
          <div className="rounded-md border border-white/10 px-3 py-1 text-xs">Households</div>
        </div>
      </div>
    </section>
  );
}
