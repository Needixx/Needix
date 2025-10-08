// app/api/auth/2fa/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { enable } = body;

    console.log(`Toggling 2FA for ${session.user.email}: ${enable ? 'enabling' : 'disabling'}`);

    // Update user's 2FA setting in database
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { twoFactorEnabled: enable },
      select: { twoFactorEnabled: true, email: true }
    });

    console.log(`2FA ${enable ? 'enabled' : 'disabled'} for user ${updatedUser.email}`);

    return NextResponse.json({ 
      success: true, 
      twoFactorEnabled: updatedUser.twoFactorEnabled 
    });
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}