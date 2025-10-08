// app/api/integrations/google/status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has Google account linked
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: "google" }
        }
      }
    });

    const googleAccount = user?.accounts?.find(account => account.provider === "google");
    const connected = !!googleAccount && !!googleAccount.access_token;

    return NextResponse.json({ 
      connected,
      hasGmailAccess: connected, // In a real implementation, check specific scopes
    });
  } catch (error) {
    console.error("Error checking Google status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}