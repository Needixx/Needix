// app/api/auth/validate-reset-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token is required.' 
      }, { status: 400 });
    }

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
        valid: false, 
        error: 'Invalid or expired token.' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true,
      email: user.email 
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'An error occurred while validating the token.' 
    }, { status: 500 });
  }
}