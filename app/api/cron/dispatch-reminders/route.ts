// app/api/cron/dispatch-reminders/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.redirect(new URL('/api/cron/notifications', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
}
export async function POST() { return GET(); }
