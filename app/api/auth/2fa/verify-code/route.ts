// app/api/auth/2fa/verify-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify2FACode } from '@/lib/auth/2fa';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ 
        error: 'Missing verification code' 
      }, { status: 400 });
    }

    console.log('Received verification request:', { code, bodyKeys: Object.keys(body) });

    // Get user from database using email (same as send-code route)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`Looking for verification code for user ${user.id} with code ${code}`);

    // Get all recent codes for debugging
    const allCodes = await prisma.verificationCode.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`Found ${allCodes.length} codes for user:`, allCodes.map(c => ({
      id: c.id,
      code: c.code,
      used: c.used,
      expired: c.expiresAt < new Date(),
      createdAt: c.createdAt
    })));

    // Get the most recent unused code for this user
    const storedCode = await prisma.verificationCode.findFirst({
      where: { 
        userId: user.id, 
        used: false,
        expiresAt: {
          gt: new Date() // Not expired
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!storedCode) {
      return NextResponse.json({ 
        error: 'No valid verification code found. Please request a new code.',
        debug: {
          userId: user.id,
          userEmail: user.email,
          foundCodes: allCodes.length,
          inputCode: code,
          recentCodes: allCodes.map(c => ({
            code: c.code,
            used: c.used,
            expired: c.expiresAt < new Date(),
            createdAt: c.createdAt.toISOString()
          }))
        }
      }, { status: 400 });
    }

    console.log(`Found stored code: ${storedCode.code}, input: ${code}`);

    // Verify the code
    const verification = verify2FACode(
      code,
      storedCode.code,
      storedCode.expiresAt,
      storedCode.used
    );

    if (!verification.valid) {
      return NextResponse.json({ 
        error: verification.error,
        debug: {
          storedCode: storedCode.code,
          inputCode: code,
          expired: storedCode.expiresAt < new Date(),
          used: storedCode.used
        }
      }, { status: 400 });
    }

    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: storedCode.id },
      data: { used: true }
    });

    console.log(`Successfully verified code for user ${user.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify 2FA code error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}