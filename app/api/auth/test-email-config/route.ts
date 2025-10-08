// app/api/auth/test-email-config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';

export async function GET(req: NextRequest) {
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
        `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'Not set',
      RESEND_FROM_VALUE: process.env.RESEND_FROM || 'Not set',
      NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL || 'Not set'
    };

    console.log('=== EMAIL TEST DEBUG ===');
    console.log('Environment check:', envCheck);
    console.log('Recipient:', session.user.email);

    // If API key is not set, return config check only
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
      return NextResponse.json({
        configured: false,
        envCheck,
        message: 'Email service is not fully configured. Please set RESEND_API_KEY and RESEND_FROM in your environment variables.'
      });
    }

    // Try to send a test email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      console.log('Attempting to send email...');
      console.log('From:', process.env.RESEND_FROM);
      console.log('To:', session.user.email);
      
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM,
        to: session.user.email,
        subject: 'Test Email - Needix Configuration',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">✅ Email Configuration Test</h2>
            <p>This is a test email from your Needix application.</p>
            <p><strong>If you're seeing this, your email configuration is working correctly!</strong></p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">Sent to: ${session.user.email}</p>
            <p style="color: #666; font-size: 14px;">Sent from: ${process.env.RESEND_FROM}</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              <strong>Note:</strong> If this landed in spam, please mark it as "Not Spam" to ensure future emails arrive in your inbox.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend API error:', error);
        return NextResponse.json({
          configured: true,
          envCheck,
          emailError: error,
          testEmailSent: false,
          message: 'Failed to send email via Resend API. Error: ' + JSON.stringify(error)
        }, { status: 500 });
      }

      console.log('Email sent successfully!');
      console.log('Email ID:', data?.id);

      return NextResponse.json({
        configured: true,
        envCheck,
        emailResult: data,
        emailId: data?.id,
        testEmailSent: true,
        sentTo: session.user.email,
        sentFrom: process.env.RESEND_FROM,
        message: 'Email sent successfully! Check your inbox (and spam folder).',
        troubleshooting: {
          checkSpam: 'Check your spam/junk folder',
          waitTime: 'Emails can take 1-2 minutes to arrive',
          verifyDomain: 'If using a custom domain in RESEND_FROM, make sure it\'s verified in Resend',
          useResendDomain: 'Try using "onboarding@resend.dev" as RESEND_FROM for testing'
        }
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      return NextResponse.json({
        configured: true,
        envCheck,
        emailError: emailError instanceof Error ? {
          message: emailError.message,
          stack: emailError.stack
        } : 'Unknown error',
        testEmailSent: false,
        message: 'Email configuration found but failed to send test email. Check the console for details.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test email config error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}