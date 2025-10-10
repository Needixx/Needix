// app/api/user/notification-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ReminderSettings = {
  enabled: boolean;
  leadDays: number[];
  timeOfDay: string;
  channels: { web: boolean; mobile: boolean; email: boolean };
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.notificationSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      const defaults: ReminderSettings = {
        enabled: false,
        leadDays: [7, 3, 1],
        timeOfDay: "09:00",
        channels: { web: true, mobile: true, email: false },
      };
      return NextResponse.json({ settings: defaults });
    }

    const apiSettings: ReminderSettings = {
      enabled: settings.enabled,
      leadDays: settings.leadDays
        .split(",")
        .map((day: string) => parseInt(day.trim(), 10))
        .filter((n: number) => Number.isFinite(n)),
      timeOfDay: settings.timeOfDay,
      channels: {
        web: settings.channels.includes("web"),
        mobile: settings.channels.includes("mobile"),
        email: settings.channels.includes("email"),
      },
    };

    return NextResponse.json({ settings: apiSettings });
  } catch (error) {
    console.error("Failed to get notification settings:", error);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ Check if user exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!userExists) {
      console.error(`User ${session.user.id} not found in database. Session user ID doesn't match any database record.`);
      return NextResponse.json(
        { error: "User not found. Please sign in again." },
        { status: 404 }
      );
    }

    const updates = (await request.json()) as Partial<ReminderSettings>;

    const dbData: Record<string, string | boolean | number> = {};
    if (typeof updates.enabled === "boolean") dbData.enabled = updates.enabled;
    if (Array.isArray(updates.leadDays)) dbData.leadDays = updates.leadDays.join(",");
    if (typeof updates.timeOfDay === "string") dbData.timeOfDay = updates.timeOfDay;
    if (updates.channels) {
      const channels: string[] = [];
      if (updates.channels.web) channels.push("web");
      if (updates.channels.mobile) channels.push("mobile");
      if (updates.channels.email) channels.push("email");
      dbData.channels = channels.join(",");
    }

    const saved = await prisma.notificationSettings.upsert({
      where: { userId: session.user.id },
      update: { ...dbData, updatedAt: new Date() },
      create: {
        userId: session.user.id,
        enabled: (dbData.enabled as boolean) ?? false,
        leadDays: (dbData.leadDays as string) ?? "7,3,1",
        timeOfDay: (dbData.timeOfDay as string) ?? "09:00",
        channels: (dbData.channels as string) ?? "web,mobile",
      },
    });

    const apiSettings: ReminderSettings = {
      enabled: saved.enabled,
      leadDays: saved.leadDays
        .split(",")
        .map((day: string) => parseInt(day.trim(), 10))
        .filter((n: number) => Number.isFinite(n)),
      timeOfDay: saved.timeOfDay,
      channels: {
        web: saved.channels.includes("web"),
        mobile: saved.channels.includes("mobile"),
        email: saved.channels.includes("email"),
      },
    };

    return NextResponse.json({ success: true, settings: apiSettings });
  } catch (error) {
    console.error("Failed to update notification settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "User not found. Please sign in again." },
        { status: 404 }
      );
    }

    await prisma.notificationSettings.upsert({
      where: { userId: session.user.id },
      update: {
        enabled: false,
        renewalReminders: true,
        priceChangeAlerts: true,
        weeklyDigest: false,
        digestDay: "monday",
        digestTime: "09:00",
        leadDays: "7,3,1",
        timeOfDay: "09:00",
        channels: "web,mobile",
        priceChangeThreshold: 5,
        renewalLeadDays: 3,
      },
      create: {
        userId: session.user.id,
        enabled: false,
        renewalReminders: true,
        priceChangeAlerts: true,
        weeklyDigest: false,
        digestDay: "monday",
        digestTime: "09:00",
        leadDays: "7,3,1",
        timeOfDay: "09:00",
        channels: "web,mobile",
        priceChangeThreshold: 5,
        renewalLeadDays: 3,
      },
    });

    return NextResponse.json({ success: true, message: "Settings reset to defaults" });
  } catch (error) {
    console.error("Failed to reset notification settings:", error);
    return NextResponse.json({ error: "Failed to reset settings" }, { status: 500 });
  }
}