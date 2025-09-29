// app/api/auth/debug/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 });
  }

  const config = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID_PREVIEW: process.env.GOOGLE_CLIENT_ID ? 
      `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'Not set',
  };

  return NextResponse.json(config);
}