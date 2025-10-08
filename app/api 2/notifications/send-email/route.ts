// app/api/notifications/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';
import { z } from 'zod';

// Configure for static export compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

const EmailNotificationSchema = z.object({
  type: z.enum(['subscription_reminder', 'price_change', 'renewal_failed', 'general']),
  subscriptionName: z.string().optional(),
  daysUntilRenewal: z.number().optional(),
  renewalDate: z.string().optional(),
  price: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  actionUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EmailNotificationSchema.parse(body);

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
      return NextResponse.json({ 
        error: 'Email service not configured' 
      }, { status: 500 });
    }

    const { 
      type, 
      subscriptionName, 
      daysUntilRenewal, 
      renewalDate, 
      price, 
      title, 
      body: emailBody,
      actionUrl 
    } = validatedData;

    const userEmail = session.user.email;
    const userName = session.user.name || 'Needix User';

    // Generate email content based on type
    const emailContent = generateEmailContent({
      type,
      userName,
      subscriptionName,
      daysUntilRenewal,
      renewalDate,
      price,
      title,
      body: emailBody,
      actionUrl: actionUrl || `${process.env.NEXTAUTH_URL}/dashboard`
    });

    // Send email
    await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return NextResponse.json({
      success: true,
      message: 'Email notification sent successfully!',
      sentTo: userEmail
    });

  } catch (error) {
    console.error('Failed to send email notification:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}

interface EmailContentParams {
  type: string;
  userName: string;
  subscriptionName?: string;
  daysUntilRenewal?: number;
  renewalDate?: string;
  price?: string;
  title: string;
  body: string;
  actionUrl: string;
}

function generateEmailContent(params: EmailContentParams) {
  const { type, userName, subscriptionName, daysUntilRenewal, renewalDate, price, title, body, actionUrl } = params;

  let subject = `🔔 ${title} - Needix`;
  let emoji = '🔔';
  let headerColor = 'linear-gradient(135deg, #8B5CF6, #06B6D4)';
  let actionButtonText = 'View Dashboard';

  // Customize based on notification type
  switch (type) {
    case 'subscription_reminder':
      emoji = '💰';
      headerColor = 'linear-gradient(135deg, #F59E0B, #EF4444)';
      actionButtonText = 'Manage Subscription';
      if (daysUntilRenewal === 0) {
        subject = `🔴 ${subscriptionName} renews TODAY - Needix`;
      } else if (daysUntilRenewal === 1) {
        subject = `⚠️ ${subscriptionName} renews TOMORROW - Needix`;
      } else {
        subject = `📅 ${subscriptionName} renews in ${daysUntilRenewal} days - Needix`;
      }
      break;
    case 'price_change':
      emoji = '💸';
      headerColor = 'linear-gradient(135deg, #DC2626, #B91C1C)';
      actionButtonText = 'Review Changes';
      subject = `💸 Price change for ${subscriptionName} - Needix`;
      break;
    case 'renewal_failed':
      emoji = '❌';
      headerColor = 'linear-gradient(135deg, #DC2626, #991B1B)';
      actionButtonText = 'Update Payment';
      subject = `❌ Payment failed for ${subscriptionName} - Needix`;
      break;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: ${headerColor}; padding: 20px; border-radius: 16px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">${emoji} Needix</h1>
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
          ${body}
        </p>

        ${subscriptionName ? `
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📋 Subscription Details</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #64748b; padding: 4px 0; font-weight: 500;">Service:</td>
              <td style="color: #1e293b; padding: 4px 0; font-weight: 600;">${subscriptionName}</td>
            </tr>
            ${renewalDate ? `
            <tr>
              <td style="color: #64748b; padding: 4px 0; font-weight: 500;">Renewal Date:</td>
              <td style="color: #1e293b; padding: 4px 0; font-weight: 600;">${formatDate(renewalDate)}</td>
            </tr>
            ` : ''}
            ${price ? `
            <tr>
              <td style="color: #64748b; padding: 4px 0; font-weight: 500;">Amount:</td>
              <td style="color: #1e293b; padding: 4px 0; font-weight: 600;">${price}</td>
            </tr>
            ` : ''}
            ${typeof daysUntilRenewal === 'number' ? `
            <tr>
              <td style="color: #64748b; padding: 4px 0; font-weight: 500;">Days Until Renewal:</td>
              <td style="color: ${daysUntilRenewal <= 1 ? '#dc2626' : daysUntilRenewal <= 3 ? '#f59e0b' : '#16a34a'}; padding: 4px 0; font-weight: 600;">
                ${daysUntilRenewal === 0 ? 'TODAY' : daysUntilRenewal === 1 ? 'TOMORROW' : `${daysUntilRenewal} days`}
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 24px 0;">
          <a href="${actionUrl}" 
             style="background: ${headerColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block;">
            ${actionButtonText}
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; color: #64748b; font-size: 14px;">
        <p style="margin: 0 0 8px 0;">
          This notification was sent from your Needix account.
        </p>
        <p style="margin: 0;">
          <a href="${process.env.NEXTAUTH_URL}/settings" style="color: #0284c7; text-decoration: none;">Manage Notifications</a> | 
          <a href="${process.env.NEXTAUTH_URL}/privacy" style="color: #0284c7; text-decoration: none;">Privacy Policy</a>
        </p>
        <p style="margin: 16px 0 0 0; font-size: 12px; color: #94a3b8;">
          Needix • Never miss a subscription renewal again
        </p>
      </div>
    </div>
  `;

  const text = `
${title}

Hi ${userName}!

${body}

${subscriptionName ? `
SUBSCRIPTION DETAILS:
Service: ${subscriptionName}
${renewalDate ? `Renewal Date: ${formatDate(renewalDate)}` : ''}
${price ? `Amount: ${price}` : ''}
${typeof daysUntilRenewal === 'number' ? 
  `Days Until Renewal: ${daysUntilRenewal === 0 ? 'TODAY' : daysUntilRenewal === 1 ? 'TOMORROW' : `${daysUntilRenewal} days`}` 
  : ''}
` : ''}

${actionButtonText}: ${actionUrl}

---
This notification was sent from your Needix account.
Manage Notifications: ${process.env.NEXTAUTH_URL}/settings
Privacy Policy: ${process.env.NEXTAUTH_URL}/privacy

Needix • Never miss a subscription renewal again
  `.trim();

  return { subject, html, text };
}