// components/SubscriptionList.tsx
'use client';
import { useMemo, useState } from 'react';
import { demoSubscriptions } from '@/lib/demo';
import type { Subscription } from '@/lib/types';
import { Button } from '@/components/ui/Button';

export default function SubscriptionList() {
  const [items] = useState<Subscription[]>(demoSubscriptions); // Removed setItems since it's not used
  const total = useMemo(() => items.reduce((acc, i) => acc + i.price, 0), [items]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your subscriptions</h3>
        <Button onClick={() => alert('Open Add Subscription modal')}>Add</Button>
      </div>
      <div className="grid gap-3">
        {items.map((i) => (
          <div key={i.id} className="rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{i.name}</p>
                <p className="text-sm text-white/60">
                  Renews {i.nextBillingDate ? new Date(`${i.nextBillingDate}T00:00:00`).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${i.price.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-end text-white/70">
        Monthly total: <span className="ml-2 font-semibold text-white">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
