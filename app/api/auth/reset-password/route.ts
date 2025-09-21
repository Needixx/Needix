// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import crypto from 'crypto';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

// Two valid body shapes: (1) forgot (email), (2) reset (token + password)
const ForgotSchema = z.object({
  email: z.string().email(),
});

const ResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json()) as unknown;

    // Try to interpret as "forgot password" first
    const forgotParsed = ForgotSchema.safeParse(raw);
    if (forgotParsed.success) {
      const { email } = forgotParsed.data;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return NextResponse.json({
          message:
            'If an account with that email exists, you will receive a password reset email.',
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to database
      await prisma.user.update({
        where: { email },
        data: {
          passwordResetToken: resetToken,
          passwordResetTokenExpiry: resetTokenExpiry,
        },
      });

      // Send email
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

      await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: email,
        subject: 'Reset Your Password - Needix',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>You requested a password reset for your Needix account.</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            <p style="margin-top: 20px; color: #666;">This link will expire in 1 hour.</p>
            <p style="color: #666;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });

      return NextResponse.json({
        message:
          'If an account with that email exists, you will receive a password reset email.',
      });
    }

    // Otherwise, try to interpret as "reset password"
    const resetParsed = ResetSchema.safeParse(raw);
    if (resetParsed.success) {
      const { token, password } = resetParsed.data;

      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token.' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        },
      });

      return NextResponse.json({
        message: 'Password has been reset successfully.',
      });
    }

    // If it matched neither schema:
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
