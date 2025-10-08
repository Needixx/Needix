import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "API routes are working!",
    timestamp: new Date().toISOString()
  });
}
