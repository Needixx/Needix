// components/ReorderList.tsx
'use client';
import { useState } from 'react';
import { demoReorders } from '@/lib/demo';
import type { ReorderItem } from '@/lib/types';
import { Button } from '@/components/ui/Button';

export default function ReorderList() {
  const [items] = useState<ReorderItem[]>(demoReorders); // Removed setItems since it's not used
  
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reorder items</h3>
        <Button onClick={() => alert('Open Add Reorder modal')}>Add</Button>
      </div>
      <div className="grid gap-3">
        {items.map((i) => (
          <div key={i.id} className="rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{i.productName}</p>
                <p className="text-sm text-white/60">Next order {i.nextOrder}</p>
              </div>
              <div className="flex items-center gap-2">
                {i.productUrl && (
                  <Button asChild variant="secondary">
                    <a href={i.productUrl} target="_blank" rel="noreferrer">Open link</a>
                  </Button>
                )}
                <Button onClick={() => alert('Mark ordered; update next date')}>Order</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}