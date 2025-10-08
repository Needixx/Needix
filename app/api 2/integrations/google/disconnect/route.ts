// app/api/integrations/google/disconnect/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Disconnecting Google account for user: ${session.user.email}`);

    // Remove Google account connection
    const deleteResult = await prisma.account.deleteMany({
      where: {
        user: { email: session.user.email },
        provider: "google"
      }
    });

    console.log(`Deleted ${deleteResult.count} Google account connections`);

    return NextResponse.json({ 
      success: true,
      message: "Google account disconnected successfully",
      deletedConnections: deleteResult.count
    });
  } catch (error) {
    console.error("Error disconnecting Google:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}