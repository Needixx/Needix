// components/DashboardTabsBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardTabsBar() {
  const pathname = usePathname();
  
  // Determine active tab based on pathname
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
    <div className="mb-6 inline-flex rounded-2xl border border-white/10 p-1 bg-white/[0.02]">
      <Tab href="/dashboard" label="Dashboard" active={active === 'dashboard'} />
      <Tab href="/dashboard/subscriptions" label="Subscriptions" active={active === 'subscriptions'} />
      <Tab href="/dashboard/orders" label="Orders" active={active === 'orders'} />
      <Tab href="/dashboard/expenses" label="Expenses" active={active === 'expenses'} />
      <Tab href="/dashboard/transactions" label="Bank Transactions" active={active === 'transactions'} />
    </div>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        'rounded-xl px-4 py-2 text-sm transition-colors',
        active ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10'
      ].join(' ')}
    >
      {label}
    </Link>
  );
}