// app/api/user/delete/route.ts
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

    // Delete user data in the correct order (respecting foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete subscriptions first
      await tx.subscription.deleteMany({
        where: { userId }
      });

      // Delete orders
      await tx.order.deleteMany({
        where: { userId }
      });

      // Delete expenses (if you have this model)
      // await tx.expense.deleteMany({
      //   where: { userId }
      // });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId }
      });

      // Delete verification tokens
      await tx.verificationToken.deleteMany({
        where: { 
          identifier: session.user?.email || ""
        }
      });

      // Delete accounts
      await tx.account.deleteMany({
        where: { userId }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Account deleted successfully" 
    });

  } catch (error) {
    console.error("Failed to delete user account:", error);
    
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}