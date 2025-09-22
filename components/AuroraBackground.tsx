// components/AuroraBackground.tsx
export default function AuroraBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-20 overflow-hidden">
      {/* base midnight wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b1020] to-slate-950" />

      {/* softer left/top violet */}
      <div className="absolute inset-0 bg-[radial-gradient(90rem_48rem_at_18%_28%,rgba(168,85,247,0.14),transparent_60%)]" />

      {/* softer right cyan */}
      <div className="absolute inset-0 bg-[radial-gradient(70rem_36rem_at_82%_32%,rgba(34,211,238,0.10),transparent_60%)]" />

      {/* faint center wash */}
      <div className="absolute inset-0 bg-[radial-gradient(75rem_75rem_at_52%_60%,rgba(139,92,246,0.06),transparent_70%)]" />

      {/* subtle texture */}
      <div className="pointer-events-none absolute inset-0 opacity-10 mix-blend-overlay
                      bg-[linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]
                      bg-[size:26px_26px]" />

      {/* soft vignette to kill the “box” edge illusion */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_58%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
