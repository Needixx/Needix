// app/api/auth/2fa/send-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVerificationCode, send2FAEmail } from '@/lib/auth/2fa';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email } = body;
    
    // Verify the email matches the session
    if (email !== session.user.email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 400 });
    }

    // Get or create user from database - use email as the key
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      // Create user if doesn't exist (shouldn't happen but just in case)
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name,
        },
        select: { id: true, name: true, email: true }
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unused codes for this user
    await prisma.verificationCode.deleteMany({
      where: { 
        userId: user.id,
        used: false 
      }
    });

    // Store new code in database
    const verificationRecord = await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
        used: false,
      }
    });

    console.log(`Created verification code for user ${user.id}: ${code} (ID: ${verificationRecord.id})`);

    // Send email
    const emailResult = await send2FAEmail({
      to: email,
      userName: user.name || 'User',
      verificationCode: code,
    });

    if (!emailResult.success) {
      // Clean up the code if email failed
      await prisma.verificationCode.delete({
        where: { id: verificationRecord.id }
      });
      
      return NextResponse.json({ 
        error: 'Failed to send verification email',
        details: emailResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      debug: {
        userId: user.id,
        email: user.email,
        codeId: verificationRecord.id
      }
    });
  } catch (error) {
    console.error('Send 2FA code error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}