// app/api/integrations/plaid/exchange-token/route.ts
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

    const { public_token, metadata } = await request.json();

    if (!public_token) {
      return NextResponse.json({ error: "Missing public_token" }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Initialize Plaid client
    const configuration = new Configuration({
      basePath: process.env.PLAID_ENV === 'production' 
        ? PlaidEnvironments.production 
        : PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
          'PLAID-SECRET': process.env.PLAID_SECRET!,
        },
      },
    });
    
    const plaidClient = new PlaidApi(configuration);

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Check if this item already exists
    const existingItem = await prisma.plaidItem.findUnique({
      where: { itemId: itemId },
    });

    if (existingItem) {
      return NextResponse.json({
        success: true,
        message: "Bank account already connected",
        alreadyConnected: true,
      });
    }

    // Get institution info
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });

    const institutionId = itemResponse.data.item.institution_id;
    const institutionName = metadata?.institution?.name || "Unknown Bank";

    // Get accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Save PlaidItem
    const plaidItem = await prisma.plaidItem.create({
      data: {
        userId: user.id,
        accessToken: accessToken,
        itemId: itemId,
        institutionId: institutionId || null,
        institutionName: institutionName,
      },
    });

    // Save PlaidAccounts
    const accounts = accountsResponse.data.accounts;
    for (const account of accounts) {
      await prisma.plaidAccount.create({
        data: {
          plaidItemId: plaidItem.id,
          accountId: account.account_id,
          name: account.name,
          type: account.type,
          subtype: account.subtype || null,
          mask: account.mask || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Bank account connected successfully",
      accounts: accounts.length,
    });

  } catch (error: any) {
    console.error("Error exchanging Plaid token:", error);
    
    if (error.response) {
      console.error("Plaid error details:", JSON.stringify(error.response.data, null, 2));
    }
    
    return NextResponse.json({
      error: "Failed to exchange token",
      details: error.response?.data?.error_message || error.message || "Unknown error"
    }, { status: 500 });
  }
}