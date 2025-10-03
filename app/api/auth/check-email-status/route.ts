// app/api/auth/check-email-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY not configured'
      }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Check the status of a specific email
    if (emailId) {
      try {
        const emailStatus = await resend.emails.get(emailId);
        return NextResponse.json({
          success: true,
          emailStatus,
          message: 'Email status retrieved'
        });
      } catch (error) {
        return NextResponse.json({
          error: 'Failed to get email status',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      error: 'No email ID provided'
    }, { status: 400 });

  } catch (error) {
    console.error('Check email status error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}