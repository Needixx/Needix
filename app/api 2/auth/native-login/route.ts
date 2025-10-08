// app/api/auth/native-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRY = '30d';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.warn('[native-login] request received', email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('[native-login] error', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
