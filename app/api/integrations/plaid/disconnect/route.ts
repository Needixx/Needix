// app/api/integrations/plaid/disconnect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find all plaid items for this user
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: user.id },
    });

    if (plaidItems.length === 0) {
      return NextResponse.json({ error: "No bank accounts connected" }, { status: 400 });
    }

    // Optional: Remove items from Plaid (requires Plaid client)
    try {
      if (process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET) {
        const configuration = new Configuration({
          basePath: process.env.PLAID_ENV === 'production' 
            ? PlaidEnvironments.production 
            : PlaidEnvironments.sandbox,
          baseOptions: {
            headers: {
              'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
              'PLAID-SECRET': process.env.PLAID_SECRET,
            },
          },
        });
        
        const plaidClient = new PlaidApi(configuration);

        // Remove all items from Plaid
        for (const plaidItem of plaidItems) {
          try {
            await plaidClient.itemRemove({
              access_token: plaidItem.accessToken,
            });
          } catch (plaidError) {
            console.error("Error removing Plaid item:", plaidError);
            // Continue with database cleanup even if Plaid removal fails
          }
        }
      }
    } catch (error) {
      console.error("Error connecting to Plaid for removal:", error);
      // Continue with database cleanup
    }

    // Remove all Plaid transactions first
    await prisma.plaidTransaction.deleteMany({
      where: {
        plaidItemId: {
          in: plaidItems.map(item => item.id),
        },
      },
    });

    // Remove all Plaid accounts
    await prisma.plaidAccount.deleteMany({
      where: {
        plaidItemId: {
          in: plaidItems.map(item => item.id),
        },
      },
    });

    // Finally remove all Plaid items
    await prisma.plaidItem.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "All bank accounts disconnected successfully",
    });

  } catch (error) {
    console.error("Error disconnecting Plaid:", error);
    return NextResponse.json({
      error: "Failed to disconnect bank accounts",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}