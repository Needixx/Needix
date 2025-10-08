// app/api/integrations/google/link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Store the user's email in state so we can verify on callback
    const state = Buffer.from(JSON.stringify({
      email: session.user.email,
      timestamp: Date.now(),
    })).toString('base64');

    // Build Google OAuth URL using OUR CUSTOM callback
    // This bypasses NextAuth's sign-in processing completely
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: `${new URL(request.url).origin}/api/integrations/google/callback`,
      response_type: 'code',
      scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: state,
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    return NextResponse.redirect(googleAuthUrl);

  } catch (error) {
    console.error("Error in Google link route:", error);
    return NextResponse.redirect(new URL(
      '/dashboard?tab=settings&section=integrations&error=link_failed',
      request.url
    ));
  }
}