// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, token, password } = body;

    // If email is provided (forgot password flow)
    if (email && !token && !password) {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return NextResponse.json({ 
          message: 'If an account with that email exists, you will receive a password reset email.' 
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
          passwordResetTokenExpiry: resetTokenExpiry
        }
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
        `
      });

      return NextResponse.json({ 
        message: 'If an account with that email exists, you will receive a password reset email.' 
      });
    }

    // If token and password are provided (reset password flow)
    if (token && password) {
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return NextResponse.json({ 
          error: 'Invalid or expired reset token.' 
        }, { status: 400 });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetTokenExpiry: null
        }
      });

      return NextResponse.json({ 
        message: 'Password has been reset successfully.' 
      });
    }

    return NextResponse.json({ 
      error: 'Invalid request.' 
    }, { status: 400 });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ 
      error: 'An error occurred while processing your request.' 
    }, { status: 500 });
  }
}