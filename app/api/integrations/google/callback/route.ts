// app/api/integrations/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL(
        '/dashboard?tab=settings&section=integrations&error=oauth_error',
        request.url
      ));
    }

    if (!code) {
      return NextResponse.redirect(new URL(
        '/dashboard?tab=settings&section=integrations&error=no_code',
        request.url
      ));
    }

    // Verify the user is still authenticated
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL(
        '/signin?error=session_expired',
        request.url
      ));
    }

    // Decode state to get user info
    let userEmail = session.user.email;
    try {
      if (state) {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
        if (decodedState.email) {
          userEmail = decodedState.email;
        }
      }
    } catch (e) {
      console.error('Failed to decode state:', e);
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${new URL(request.url).origin}/api/integrations/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    // Get Google user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: googleUser } = await oauth2.userinfo.get();

    if (!googleUser.id || !googleUser.email) {
      throw new Error('Invalid Google user data');
    }

    console.log('Linking Google account:', googleUser.email, 'to user:', userEmail);

    // Find the current user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        accounts: {
          where: { provider: 'google' }
        }
      }
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Check if this Google account is already linked
    const existingGoogleAccount = user.accounts.find(
      acc => acc.providerAccountId === googleUser.id
    );

    if (existingGoogleAccount) {
      // Update tokens for existing link
      await prisma.account.update({
        where: { id: existingGoogleAccount.id },
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || existingGoogleAccount.refresh_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
          scope: tokens.scope || existingGoogleAccount.scope,
          token_type: tokens.token_type || 'Bearer',
        }
      });
      console.log('Updated existing Google account link');
    } else {
      // Create new account link
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleUser.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
          scope: tokens.scope,
          token_type: tokens.token_type || 'Bearer',
          id_token: tokens.id_token,
        }
      });
      console.log('Created new Google account link');
    }

    // Success! Redirect back to settings
    return NextResponse.redirect(new URL(
      '/dashboard?tab=settings&section=integrations&google_connected=true',
      request.url
    ));

  } catch (error) {
    console.error("Error in Google callback handler:", error);
    return NextResponse.redirect(new URL(
      '/dashboard?tab=settings&section=integrations&error=link_failed',
      request.url
    ));
  }
}