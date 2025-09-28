// lib/auth/2fa.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email template for 2FA code
function generate2FAEmailHTML(params: {
  userName: string;
  verificationCode: string;
  expiresInMinutes: number;
}) {
  const { userName, verificationCode, expiresInMinutes } = params;
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); padding: 20px; border-radius: 16px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Needix</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">Security Verification</p>
        </div>
      </div>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Hi ${userName}! 👋</h2>
        <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px;">
          Someone is trying to sign in to your Needix account. If this was you, please use the verification code below:
        </p>
        
        <div style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 20px; border-radius: 12px; margin: 20px 0; font-family: 'Courier New', monospace;">
          ${verificationCode}
        </div>
        
        <p style="color: #64748b; margin: 0 0 20px 0; font-size: 14px;">
          This code will expire in ${expiresInMinutes} minutes.
        </p>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Security Notice:</strong> If you didn't request this code, someone may be trying to access your account. 
            Please ignore this email and consider changing your password.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; color: #64748b; font-size: 14px; margin-top: 20px;">
        <p style="margin: 0 0 8px 0;">This verification code was sent from your Needix account.</p>
        <p style="margin: 0;">
          <a href="${process.env.NEXTAUTH_URL}/settings" style="color: #0284c7; text-decoration: none;">Account Settings</a> | 
          <a href="${process.env.NEXTAUTH_URL}/privacy" style="color: #0284c7; text-decoration: none;">Privacy Policy</a>
        </p>
      </div>
    </div>
  `;
}

// Send 2FA verification email
export async function send2FAEmail(params: {
  to: string;
  userName: string;
  verificationCode: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; error?: string }> {
  const { to, userName, verificationCode, expiresInMinutes = 10 } = params;

  try {
    // Check if email service is configured
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
      console.error('2FA Email service not configured - missing RESEND_API_KEY or RESEND_FROM');
      return { 
        success: false, 
        error: 'Email service not configured' 
      };
    }

    const html = generate2FAEmailHTML({ userName, verificationCode, expiresInMinutes });
    
    const text = `
Hi ${userName}!

Someone is trying to sign in to your Needix account. If this was you, please use this verification code:

${verificationCode}

This code will expire in ${expiresInMinutes} minutes.

If you didn't request this code, someone may be trying to access your account. Please ignore this email and consider changing your password.

---
Needix Security Team
${process.env.NEXTAUTH_URL}
    `.trim();

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to,
      subject: `🔐 Your Needix verification code: ${verificationCode}`,
      html,
      text,
    });

    console.log('2FA email sent successfully:', { to, id: result.data?.id });
    return { success: true };
  } catch (error) {
    console.error('Failed to send 2FA email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

// Verify 2FA code
export function verify2FACode(
  inputCode: string, 
  storedCode: string, 
  expiresAt: Date, 
  used: boolean
): { valid: boolean; error?: string } {
  if (used) {
    return { valid: false, error: 'Code has already been used' };
  }
  
  if (new Date() > expiresAt) {
    return { valid: false, error: 'Code has expired' };
  }
  
  if (inputCode !== storedCode) {
    return { valid: false, error: 'Invalid code' };
  }
  
  return { valid: true };
}