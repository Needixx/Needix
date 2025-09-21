// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// GET - Get user profile
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Return user profile data
    const userProfile = {
      id: session.user.email,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      isPro: false, // You'll determine this from your subscription logic
      subscriptionCount: 0,
      monthlyTotal: 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  preferences: z.unknown(),
});

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const raw = (await req.json()) as unknown;
    const parsed = UpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { preferences } = parsed.data;

    // In production, update user preferences in database
    return NextResponse.json({
      message: 'Profile updated successfully',
      preferences,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
