// app/api/user/clear-data/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all user data (but keep the user account)
    await prisma.$transaction(async (tx) => {
      // Delete all subscriptions
      await tx.subscription.deleteMany({
        where: { userId }
      });

      // Delete all orders
      await tx.order.deleteMany({
        where: { userId }
      });

      // Delete all expenses
      await tx.expense.deleteMany({
        where: { userId }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "All data cleared successfully" 
    });

  } catch (error) {
    console.error("Failed to clear user data:", error);
    
    return NextResponse.json(
      { error: "Failed to clear data" },
      { status: 500 }
    );
  }
}