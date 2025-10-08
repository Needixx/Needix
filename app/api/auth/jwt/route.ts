// app/api/auth/jwt/route.ts

import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-change-in-production";
const JWT_EXPIRES_IN = "30d"; // 30 days for mobile

interface JWTPayload {
  userId: string;
  email: string;
  name: string | null;
}

// Sign in with JWT (for mobile)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Sign up
    if (action === "signup") {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }

      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: body.name || email.split("@")[0],
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      const token = sign(
        {
          userId: user.id,
          email: user.email!,
          name: user.name,
        } as JWTPayload,
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    // Sign in
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
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = sign(
      {
        userId: user.id,
        email: user.email!,
        name: user.name,
      } as JWTPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
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
    console.error("JWT auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// Verify JWT token
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const decoded = verify(token, JWT_SECRET) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("JWT verify error:", error);
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }
}