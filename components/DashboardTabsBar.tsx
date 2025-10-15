// components/DashboardTabsBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardTabsBar() {
  const pathname = usePathname();

  const active: 'dashboard' | 'subscriptions' | 'orders' | 'expenses' | 'transactions' | 'none' =
    pathname === '/dashboard'
      ? 'dashboard'
      : pathname?.startsWith('/dashboard/transactions')
      ? 'transactions'
      : pathname?.startsWith('/dashboard/expenses')
      ? 'expenses'
      : pathname?.startsWith('/dashboard/orders')
      ? 'orders'
      : pathname?.startsWith('/dashboard/subscriptions')
      ? 'subscriptions'
      : 'none';

  return (
    // Horizontal scroll container on mobile; normal inline on md+
    <div className="mb-6 -mx-4 overflow-x-auto md:overflow-visible">
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="mx-4 inline-flex whitespace-nowrap rounded-2xl border border-white/10 p-1 bg-white/[0.02] gap-1 snap-x snap-mandatory"
      >
        <Tab href="/dashboard" label="Dashboard" active={active === 'dashboard'} />
        <Tab href="/dashboard/subscriptions" label="Subscriptions" active={active === 'subscriptions'} />
        <Tab href="/dashboard/orders" label="Orders" active={active === 'orders'} />
        <Tab href="/dashboard/expenses" label="Expenses" active={active === 'expenses'} />
        <Tab href="/dashboard/transactions" label="Bank Transactions" active={active === 'transactions'} />
      </div>
    </div>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={[
        // Ensure comfortable touch target + snap alignment
        'rounded-xl px-4 py-2 text-sm transition-colors mobile-touch-target snap-center',
        active ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10'
      ].join(' ')}
    >
      {label}
    </Link>
  );
}
