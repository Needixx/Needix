// app/api/integrations/google/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check if user is already authenticated
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(new URL(
        `/dashboard?tab=settings&section=integrations&error=google_not_configured`,
        request.url
      ));
    }

    // Get the callback URL
    const callbackUrl = `/dashboard?tab=settings&section=integrations&google_connected=true`;
    
    // Redirect directly to NextAuth's Google provider with the callback
    const authUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    
    return NextResponse.redirect(new URL(authUrl, request.url));
    
  } catch (error) {
    console.error("Error initiating Google connection:", error);
    return NextResponse.redirect(new URL(
      `/dashboard?tab=settings&section=integrations&error=connection_failed`,
      request.url
    ));
  }
}