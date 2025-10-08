// app/api/auth/2fa/debug-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { send2FAEmail } from '@/lib/auth/2fa';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables
    const envCheck = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM: !!process.env.RESEND_FROM,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      RESEND_API_KEY_VALUE: process.env.RESEND_API_KEY ? 
        `${process.env.RESEND_API_KEY.substring(0, 8)}...` : 'Not set',
      RESEND_FROM_VALUE: process.env.RESEND_FROM || 'Not set'
    };

    console.log('Environment check:', envCheck);

    // Try to send a test 2FA email
    const testCode = '123456';
    const emailResult = await send2FAEmail({
      to: session.user.email,
      userName: session.user.name || 'Test User',
      verificationCode: testCode,
    });

    return NextResponse.json({
      envCheck,
      emailResult,
      testCode,
      sentTo: session.user.email
    });

  } catch (error) {
    console.error('Debug 2FA email error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}