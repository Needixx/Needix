// app/api/diagnostics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check all critical environment variables
    const diagnostics = {
      timestamp: new Date().toISOString(),
      user: {
        email: session.user.email,
        id: session.user.id,
      },
      
      // Email configuration
      email: {
        configured: !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM),
        resendApiKey: process.env.RESEND_API_KEY ? 
          `${process.env.RESEND_API_KEY.substring(0, 8)}...` : '❌ NOT SET',
        resendFrom: process.env.RESEND_FROM || '❌ NOT SET',
        recommendation: !process.env.RESEND_API_KEY || !process.env.RESEND_FROM ?
          'Set RESEND_API_KEY and RESEND_FROM in Vercel Environment Variables' : '✅ Configured'
      },
      
      // Web Push configuration
      webPush: {
        configured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY ? 
          `${process.env.VAPID_PUBLIC_KEY.substring(0, 20)}...` : '❌ NOT SET',
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ? 
          '✅ SET (hidden)' : '❌ NOT SET',
        vapidSubject: process.env.VAPID_SUBJECT || '❌ NOT SET',
        clientSideEnabled: process.env.NEXT_PUBLIC_ENABLE_WEB_PUSH === '1' ? '✅ Enabled' : '❌ NOT ENABLED',
        recommendation: !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY ?
          'Generate VAPID keys: npx web-push generate-vapid-keys, then set in Vercel' : 
          process.env.NEXT_PUBLIC_ENABLE_WEB_PUSH !== '1' ?
          'Set NEXT_PUBLIC_ENABLE_WEB_PUSH=1 in Vercel Environment Variables' : '✅ Configured'
      },
      
      // Auth configuration
      auth: {
        authSecret: process.env.AUTH_SECRET ? '✅ SET' : '❌ NOT SET',
        nextAuthUrl: process.env.NEXTAUTH_URL || '❌ NOT SET',
      },
      
      // Database
      database: {
        url: process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET',
      },
      
      // Instructions
      instructions: {
        email: [
          '1. Sign up at resend.com',
          '2. Get your API key from the dashboard',
          '3. Add to Vercel: RESEND_API_KEY=re_...',
          '4. Add to Vercel: RESEND_FROM=onboarding@resend.dev (or your verified domain)',
          '5. Redeploy your app'
        ],
        webPush: [
          '1. Run locally: npx web-push generate-vapid-keys',
          '2. Copy the Public Key and Private Key',
          '3. Add to Vercel: VAPID_PUBLIC_KEY=...',
          '4. Add to Vercel: VAPID_PRIVATE_KEY=...',
          '5. Add to Vercel: VAPID_SUBJECT=mailto:your@email.com',
          '6. Add to Vercel: NEXT_PUBLIC_ENABLE_WEB_PUSH=1',
          '7. Redeploy your app'
        ]
      }
    };

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}