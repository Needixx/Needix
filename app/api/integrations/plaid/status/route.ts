// app/api/integrations/plaid/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all plaid items with their accounts
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: user.id },
      include: {
        accounts: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const isConnected = plaidItems.length > 0;

    return NextResponse.json({
      connected: isConnected,
      items: plaidItems.map(item => ({
        id: item.id,
        institutionName: item.institutionName,
        accountCount: item.accounts.length,
        accounts: item.accounts.map(account => ({
          id: account.id,
          name: account.name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
        })),
        connectedAt: item.createdAt,
      })),
    });

  } catch (error) {
    console.error("Error fetching Plaid status:", error);
    return NextResponse.json({
      error: "Failed to fetch bank connection status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}