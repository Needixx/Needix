// app/api/admin/cleanup-duplicate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Only in dev" }, { status: 403 });
  }

  try {
    // First, let's see what we have
    const users = await prisma.user.findMany({
      where: { email: 'devannaastad@gmail.com' },
      include: {
        accounts: true
      }
    });

    console.log('Found users:', JSON.stringify(users, null, 2));

    // Find the user WITHOUT a Google account
    const userToDelete = users.find(u => !u.accounts.some(a => a.provider === 'google'));

    if (!userToDelete) {
      return NextResponse.json({ error: "No duplicate found" });
    }

    // Delete related records first
    await prisma.account.deleteMany({
      where: { userId: userToDelete.id }
    });

    await prisma.session.deleteMany({
      where: { userId: userToDelete.id }
    });

    // Delete any subscriptions
    await prisma.subscription.deleteMany({
      where: { userId: userToDelete.id }
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userToDelete.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Deleted duplicate user: ${userToDelete.id}`,
      deletedUser: userToDelete
    });

  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}