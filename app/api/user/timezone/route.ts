// app/api/user/timezone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { timeZone } = (await req.json()) as { timeZone?: string };
    if (!timeZone || typeof timeZone !== "string" || !timeZone.includes("/")) {
      return NextResponse.json({ error: "Invalid timeZone" }, { status: 400 });
    }

    // Persist cookie for everyone (helps SSR)
    const res = NextResponse.json({ ok: true });
    res.cookies.set("tz", timeZone, {
      path: "/",
      maxAge: 60 * 60 * 24 * 180, // 180 days
      sameSite: "lax",
    });

    // If signed in, persist on User
    const session = await auth();
    if (session?.user?.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { timezone: timeZone },
      });
    }

    return res;
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
