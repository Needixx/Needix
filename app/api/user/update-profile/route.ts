// app/api/user/update-profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const nameRaw = (body?.name ?? "") as string;
    const name = nameRaw.trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Update user name in database
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name },
      select: { name: true, email: true },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
