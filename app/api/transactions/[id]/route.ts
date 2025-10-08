// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: transactionId } = await context.params;

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Check if this is a PlaidTransaction
    const plaidTransaction = await prisma.plaidTransaction.findUnique({
      where: { id: transactionId },
      include: { 
        plaidItem: true,
      },
    });

    if (plaidTransaction) {
      // Verify ownership through plaid item
      if (plaidTransaction.plaidItem.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized to delete this transaction" },
          { status: 403 }
        );
      }

      // Delete the PlaidTransaction
      await prisma.plaidTransaction.delete({
        where: { id: transactionId },
      });

      return NextResponse.json({
        success: true,
        message: "Transaction deleted successfully",
      });
    }

    // Transaction not found
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      {
        error: "Failed to delete transaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}