// app/api/integrations/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // In a real implementation, you'd fetch webhooks from database
    // For now, return mock data
    const webhooks = [
      {
        id: "1",
        url: "https://example.com/webhooks/needix",
        events: ["subscription.created", "subscription.renewed", "price.changed"],
        active: true,
        createdAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, events, secret } = body as WebhookConfig;

    if (!url || !events || events.length === 0) {
      return NextResponse.json({ error: "URL and events are required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Validate events
    const validEvents = [
      "subscription.created",
      "subscription.updated", 
      "subscription.deleted",
      "subscription.renewed",
      "price.changed",
      "payment.due",
      "payment.failed"
    ];

    const invalidEvents = events.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      return NextResponse.json({ 
        error: `Invalid events: ${invalidEvents.join(", ")}`,
        validEvents 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // In a real implementation, save to database
    const webhook = {
      id: Date.now().toString(),
      userId: user.id,
      url,
      events,
      secret: secret || null,
      active: true,
      createdAt: new Date().toISOString()
    };

    // Test webhook with a ping
    try {
      const testPayload = {
        event: "webhook.test",
        data: {
          message: "Webhook successfully configured!",
          timestamp: new Date().toISOString()
        }
      };

      const webhookResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Needix-Webhooks/1.0",
          ...(secret && { "X-Needix-Signature": `sha256=${secret}` })
        },
        body: JSON.stringify(testPayload)
      });

      if (!webhookResponse.ok) {
        return NextResponse.json({ 
          error: "Webhook endpoint test failed",
          status: webhookResponse.status 
        }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: "Failed to connect to webhook endpoint",
        details: error instanceof Error ? error.message : "Unknown error"
      }, { status: 400 });
    }

    return NextResponse.json({ 
      webhook,
      message: "Webhook created and tested successfully" 
    });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}