// app/api/expenses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type Recurrence = "none" | "weekly" | "monthly" | "yearly";

function normalizeRecurrence(value: unknown): Recurrence | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.toLowerCase() as Recurrence;
  return v === "none" || v === "weekly" || v === "monthly" || v === "yearly"
    ? v
    : undefined;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Ownership check
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  // Support both `description` and legacy `name`
  const description =
    (typeof body.description === "string" ? body.description : undefined) ??
    (typeof body.name === "string" ? body.name : undefined);

  const data: Prisma.ExpenseUpdateInput = {};

  if (description !== undefined) data.description = description;

  if (
    body.amount !== undefined &&
    body.amount !== null &&
    !Number.isNaN(Number(body.amount))
  ) {
    data.amount = new Prisma.Decimal(body.amount);
  }

  if (typeof body.currency === "string") {
    data.currency = body.currency;
  }

  // category/merchant might be nullable in your schema; if they are NOT nullable,
  // just drop the "?? null" and assign strings only.
  if ("category" in body) {
    data.category =
      body.category === null || body.category === undefined
        ? // if nullable in Prisma schema:
          // { set: null }
          // if NOT nullable, omit the update by not setting anything:
          undefined
        : { set: String(body.category) };
  }

  if ("merchant" in body) {
    data.merchant =
      body.merchant === null || body.merchant === undefined
        ? // if nullable in Prisma schema:
          // { set: null }
          // if NOT nullable, omit the update by not setting anything:
          undefined
        : { set: String(body.merchant) };
  }

  // IMPORTANT: your Prisma type shows `date` is NOT nullable.
  // Only update when we have a valid date; never set null.
  if ("date" in body) {
    const d = new Date(body.date);
    if (!isNaN(d.getTime())) {
      data.date = d; // ok for non-nullable DateTime
    }
    // else: ignore invalid/null and do not update date
  }

  const rec = normalizeRecurrence(body.recurrence);
  if (rec !== undefined) data.recurrence = rec;

  if (typeof body.isEssential === "boolean") {
    data.isEssential = body.isEssential;
  }

  try {
    const updated = await prisma.expense.update({
      where: { id, userId: session.user.id },
      data,
    });

    // Respond in the shape your hook expects
    return NextResponse.json({
      id: updated.id,
      description: updated.description,
      amount: Number(updated.amount),
      currency: updated.currency,
      date: updated.date ? updated.date.toISOString() : null, // frontend tolerates null-ish
      merchant: updated.merchant ?? null,
      category: updated.category ?? null,
      recurrence: updated.recurrence as Recurrence,
      isEssential: updated.isEssential,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("PATCH /api/expenses/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Enforce ownership
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/expenses/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
