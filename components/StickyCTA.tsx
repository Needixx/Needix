// components/StickyCTA.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-4 z-40 mx-auto w-[95%] max-w-3xl transform rounded-2xl border border-cyan-400/30 bg-black/60 p-3 backdrop-blur transition-all ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm text-white/80">
          Start free — set up renewal alerts in under 5 minutes.
        </p>
        <Link
          href="/dashboard"
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500"
        >
          Start Free
        </Link>
      </div>
    </div>
  );
}
