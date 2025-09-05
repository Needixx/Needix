"use client";

import { useState } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import AddSubscriptionDialog, {
  EditSubscriptionDialog,
  type SubscriptionFormData,
} from "@/components/AddSubscriptionDialog";
import ImportCsv from "@/components/ImportCsv";
import SubscriptionTable from "@/components/SubscriptionTable";
import StatsCards from "@/components/StatsCards";
import type { Subscription } from "@/lib/types";

export default function DashboardClient() {
  const { items, add, remove, update, importMany, totals } = useSubscriptions();

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  function handleStartEdit(sub: Subscription) {
    setEditingSub(sub);
    setIsEditOpen(true);
  }

  // Called by the edit dialog after user hits "Update"
  async function handleUpdate(data: SubscriptionFormData & { id?: string }) {
    if (!data.id) return; // safety
    // Build a patch for your updater's signature: (id, patch)
    await update(data.id, {
      name: data.name,
      price: data.price,
      period: data.period,
      nextBillingDate: data.nextBillingDate,
      category: data.category,
      notes: data.notes,
      // currency stays unchanged in DB (already USD)
    });
    setIsEditOpen(false);
    setEditingSub(null);
  }

  return (
    <>
      <StatsCards monthly={totals.monthly} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AddSubscriptionDialog onAdd={add} />
        <ImportCsv onImport={importMany} />
      </div>

      <SubscriptionTable
        items={items}
        onDelete={remove}
        onUpdate={update}
        onEdit={handleStartEdit} // <-- new prop
      />

      {editingSub && (
        <EditSubscriptionDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          initial={{
            id: editingSub.id,
            name: editingSub.name,
            price: editingSub.price,
            period: editingSub.period,
            nextBillingDate: editingSub.nextBillingDate,
            category: editingSub.category,
            notes: editingSub.notes,
            currency: "USD",
          }}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}
