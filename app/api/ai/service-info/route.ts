// app/api/ai/service-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Service database for auto-fill functionality
const SERVICE_DATABASE = {
  netflix: {
    name: "Netflix",
    price: 15.49,
    currency: "USD",
    period: "monthly",
    category: "Entertainment",
    website: "https://netflix.com"
  },
  spotify: {
    name: "Spotify Premium",
    price: 10.99,
    currency: "USD", 
    period: "monthly",
    category: "Entertainment",
    website: "https://spotify.com"
  },
  "apple music": {
    name: "Apple Music",
    price: 10.99,
    currency: "USD",
    period: "monthly", 
    category: "Entertainment",
    website: "https://music.apple.com"
  },
  "adobe creative cloud": {
    name: "Adobe Creative Cloud",
    price: 52.99,
    currency: "USD",
    period: "monthly",
    category: "Software",
    website: "https://adobe.com"
  },
  "chatgpt plus": {
    name: "ChatGPT Plus",
    price: 20.00,
    currency: "USD",
    period: "monthly",
    category: "AI Tools",
    website: "https://openai.com"
  },
  "github copilot": {
    name: "GitHub Copilot",
    price: 10.00,
    currency: "USD",
    period: "monthly",
    category: "Development",
    website: "https://github.com/features/copilot"
  },
  "microsoft 365": {
    name: "Microsoft 365",
    price: 6.99,
    currency: "USD",
    period: "monthly",
    category: "Software",
    website: "https://microsoft.com/microsoft-365"
  },
  "google one": {
    name: "Google One",
    price: 1.99,
    currency: "USD",
    period: "monthly",
    category: "Storage",
    website: "https://one.google.com"
  },
  "icloud+": {
    name: "iCloud+",
    price: 0.99,
    currency: "USD",
    period: "monthly",
    category: "Storage", 
    website: "https://icloud.com"
  },
  "amazon prime": {
    name: "Amazon Prime",
    price: 14.98,
    currency: "USD",
    period: "monthly",
    category: "Shopping",
    website: "https://amazon.com/prime"
  },
  "hulu": {
    name: "Hulu",
    price: 7.99,
    currency: "USD",
    period: "monthly",
    category: "Entertainment",
    website: "https://hulu.com"
  },
  "disney+": {
    name: "Disney+",
    price: 7.99,
    currency: "USD",
    period: "monthly",
    category: "Entertainment",
    website: "https://disneyplus.com"
  },
  "youtube premium": {
    name: "YouTube Premium",
    price: 13.99,
    currency: "USD",
    period: "monthly",
    category: "Entertainment",
    website: "https://youtube.com/premium"
  },
  "notion": {
    name: "Notion",
    price: 8.00,
    currency: "USD",
    period: "monthly",
    category: "Productivity",
    website: "https://notion.so"
  },
  "slack": {
    name: "Slack Pro",
    price: 7.25,
    currency: "USD",
    period: "monthly",
    category: "Communication",
    website: "https://slack.com"
  },
  "dropbox": {
    name: "Dropbox Plus",
    price: 11.99,
    currency: "USD",
    period: "monthly",
    category: "Storage",
    website: "https://dropbox.com"
  },
  "canva": {
    name: "Canva Pro",
    price: 14.99,
    currency: "USD",
    period: "monthly",
    category: "Design",
    website: "https://canva.com"
  },
  "figma": {
    name: "Figma Professional",
    price: 12.00,
    currency: "USD",
    period: "monthly",
    category: "Design",
    website: "https://figma.com"
  },
  "zoom": {
    name: "Zoom Pro",
    price: 14.99,
    currency: "USD",
    period: "monthly",
    category: "Communication",
    website: "https://zoom.us"
  }
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { serviceName } = await req.json();
    
    if (!serviceName || typeof serviceName !== 'string') {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    // Check if AI auto-fill is enabled for this user
    const aiSettings = (() => {
      try {
        const stored = localStorage.getItem("needix_ai");
        return stored ? JSON.parse(stored) : { autoFillForms: false };
      } catch {
        return { autoFillForms: false };
      }
    })();

    if (!aiSettings.autoFillForms) {
      return NextResponse.json({ 
        suggestion: null, 
        message: "AI auto-fill is disabled" 
      });
    }

    // Normalize service name for lookup
    const normalizedName = serviceName.toLowerCase().trim();
    
    // Look for exact match first
    let serviceInfo = SERVICE_DATABASE[normalizedName as keyof typeof SERVICE_DATABASE];
    
    // If no exact match, try partial matching
    if (!serviceInfo) {
      const partialMatch = Object.keys(SERVICE_DATABASE).find(key => 
        key.includes(normalizedName) || normalizedName.includes(key)
      );
      
      if (partialMatch) {
        serviceInfo = SERVICE_DATABASE[partialMatch as keyof typeof SERVICE_DATABASE];
      }
    }

    if (serviceInfo) {
      return NextResponse.json({
        suggestion: serviceInfo,
        confidence: "high",
        message: "Auto-fill suggestion found"
      });
    }

    // If no match found, return empty suggestion
    return NextResponse.json({
      suggestion: null,
      confidence: "none",
      message: "No auto-fill data available for this service"
    });

  } catch (error) {
    console.error("AI service info error:", error);
    return NextResponse.json(
      { error: "Failed to get service information" },
      { status: 500 }
    );
  }
}