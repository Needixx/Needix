// app/api/ai/chat-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Simple in-memory storage for demo purposes
// In production, you'd use a database
type ChatMessage = {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  context?: string;
};

const chatHistory = new Map<string, ChatMessage[]>();

// Get chat history
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    
    // For demo purposes, we'll assume history retention is enabled
    // In production, this would be stored in the database per user
    const retainHistory = true;

    if (!retainHistory) {
      return NextResponse.json({ 
        messages: [],
        message: "Chat history retention is disabled" 
      });
    }

    // Get chat history from memory (replace with database in production)
    const userHistory = chatHistory.get(userId) || [];
    
    return NextResponse.json({
      messages: userHistory.slice(-50), // Last 50 messages
      count: userHistory.length
    });

  } catch (error) {
    console.error("Chat history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

// Save chat message
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { role, content, context } = await req.json();
    const userId = session.user.id;

    // For demo purposes, we'll assume history retention is enabled
    // In production, this would be stored in the database per user
    const retainHistory = true;

    if (!retainHistory) {
      return NextResponse.json({ 
        success: false,
        message: "Chat history retention is disabled" 
      });
    }

    // Create new message
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
      context: context || undefined
    };

    // Add to user's history (replace with database in production)
    const userHistory = chatHistory.get(userId) || [];
    userHistory.push(message);
    
    // Keep only last 100 messages to prevent memory issues
    if (userHistory.length > 100) {
      userHistory.splice(0, userHistory.length - 100);
    }
    
    chatHistory.set(userId, userHistory);

    return NextResponse.json({
      success: true,
      messageId: message.id,
      message: "Chat message saved"
    });

  } catch (error) {
    console.error("Chat history save error:", error);
    return NextResponse.json(
      { error: "Failed to save chat message" },
      { status: 500 }
    );
  }
}

// Clear chat history
export async function DELETE(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Clear chat history for this user
    chatHistory.delete(userId);

    return NextResponse.json({
      success: true,
      deletedCount: 1,
      message: "Chat history cleared"
    });

  } catch (error) {
    console.error("Chat history clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear chat history" },
      { status: 500 }
    );
  }
}