// app/api/integrations/plaid/create-link-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from 'plaid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database to use their ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if Plaid is configured
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      console.error("Plaid environment variables missing");
      return NextResponse.json({ 
        error: "Plaid is not configured. Please add PLAID_CLIENT_ID and PLAID_SECRET to your environment variables." 
      }, { status: 500 });
    }

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

    const response = await plaidClient.linkTokenCreate({
      client_name: "Needix",
      country_codes: [CountryCode.Us],
      language: 'en',
      user: {
        client_user_id: user.id, // Use user.id instead of email
      },
      products: [Products.Transactions],
    });
    
    return NextResponse.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    });

  } catch (error: any) {
    console.error("Error creating Plaid link token:", error.message);
    
    if (error.response) {
      console.error("Plaid error details:", JSON.stringify(error.response.data, null, 2));
    }
    
    return NextResponse.json({
      error: "Failed to create link token",
      details: error.response?.data?.error_message || error.message || "Unknown error",
      plaidError: error.response?.data
    }, { status: 500 });
  }
}