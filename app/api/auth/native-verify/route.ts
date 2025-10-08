// app/api/auth/native-verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production';

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Token is valid
    return NextResponse.json({
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
      },
    });
  } catch (error) {
    console.error('[native-verify] Token verification failed:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}