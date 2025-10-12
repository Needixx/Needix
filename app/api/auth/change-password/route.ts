// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Both old and new passwords are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json({ 
        error: 'User not found or password not set' 
      }, { status: 404 });
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ 
      error: 'Failed to change password' 
    }, { status: 500 });
  }
}