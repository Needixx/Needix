// app/api/notifications/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';
import { z } from 'zod';

// Configure for static export compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

const TestEmailSchema = z.object({
  type: z.literal('test'),
  title: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = TestEmailSchema.parse(body);

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
      return NextResponse.json({ 
        error: 'Email service not configured',
        message: 'Email notifications are not properly configured on the server'
      }, { status: 500 });
    }

    const { title, body: emailBody } = validatedData;
    const userEmail = session.user.email;
    const userName = session.user.name || 'Needix User';

    // Send test email
    await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: userEmail,
      subject: `🔔 ${title} - Needix`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); padding: 20px; border-radius: 16px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">🔔 Needix</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">Subscription Management</p>
            </div>
          </div>

          <!-- Main Content -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">${title}</h2>
            
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
              Hi ${userName}! 👋
            </p>
            
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
              ${emailBody}
            </p>

            <div style="background: #e0f2fe; border: 1px solid #0284c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #0c4a6e; margin: 0; font-size: 14px;">
                <strong>✅ Email notifications are working!</strong><br>
                You'll receive reminders about your subscription renewals, price changes, and important updates right in your inbox.
              </p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">
              This email was sent from your Needix notification settings.
            </p>
            <p style="margin: 0;">
              <a href="${process.env.NEXTAUTH_URL}/settings" style="color: #0284c7; text-decoration: none;">Manage Settings</a> | 
              <a href="${process.env.NEXTAUTH_URL}/privacy" style="color: #0284c7; text-decoration: none;">Privacy Policy</a>
            </p>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #94a3b8;">
              Needix • Subscription Management Made Simple
            </p>
          </div>
        </div>
      `,
      // Also include a plain text version
      text: `
${title}

Hi ${userName}!

${emailBody}

✅ Email notifications are working! You'll receive reminders about your subscription renewals, price changes, and important updates right in your inbox.

View your dashboard: ${process.env.NEXTAUTH_URL}/dashboard
Manage settings: ${process.env.NEXTAUTH_URL}/settings

---
Needix • Subscription Management Made Simple
      `.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      sentTo: userEmail
    });

  } catch (error) {
    console.error('Failed to send test email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Handle Resend-specific errors
    if (error && typeof error === 'object' && 'message' in error) {
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          message: String(error.message) 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        message: 'An unexpected error occurred while sending the email'
      },
      { status: 500 }
    );
  }
}