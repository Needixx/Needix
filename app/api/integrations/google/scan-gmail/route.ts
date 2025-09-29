// app/api/integrations/google/scan-gmail/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from 'googleapis';

// Types for detected items
interface DetectedItem {
  id: string;
  type: "subscription" | "order" | "expense";
  name: string;
  category: string;
  amount: number | null; // Allow null for orders without prices
  currency: string;
  interval?: string;
  date?: string;
  vendor?: string;
  merchant?: string;
  confidence: number;
  emailSubject: string;
  emailId: string;
  selected: boolean;
  description?: string; // Add description field
}

interface EmailPattern {
  pattern: RegExp;
  type: "subscription" | "order" | "expense";
  category: string;
  weight: number;
}

// More precise patterns with weight scoring
const STRONG_SUBSCRIPTION_PATTERNS: EmailPattern[] = [
  { pattern: /subscription (has been )?renewed|recurring payment (processed|received)/i, type: "subscription", category: "Subscription", weight: 90 },
  { pattern: /your (monthly|annual|yearly) (subscription|membership)/i, type: "subscription", category: "Subscription", weight: 85 },
  { pattern: /auto-renewal (successful|processed)|automatically renewed/i, type: "subscription", category: "Subscription", weight: 85 },
  { pattern: /subscription confirmation|welcome to your subscription/i, type: "subscription", category: "Subscription", weight: 80 },
];

const STRONG_ORDER_PATTERNS: EmailPattern[] = [
  { pattern: /order confirmation|your order (has been|is) confirmed/i, type: "order", category: "Shopping", weight: 90 },
  { pattern: /order #[\w\d-]+|order number:?\s*[\w\d-]+/i, type: "order", category: "Shopping", weight: 85 },
  { pattern: /your (purchase|order) receipt|receipt for your (purchase|order)/i, type: "order", category: "Shopping", weight: 85 },
  { pattern: /thank you for your (order|purchase)/i, type: "order", category: "Shopping", weight: 80 },
  { pattern: /tracking (number|information)|has (shipped|been shipped)/i, type: "order", category: "Shopping", weight: 75 },
  { pattern: /order placed|you (ordered|bought)/i, type: "order", category: "Shopping", weight: 70 },
];

const STRONG_EXPENSE_PATTERNS: EmailPattern[] = [
  { pattern: /payment (confirmation|receipt)|payment successful/i, type: "expense", category: "Expense", weight: 80 },
  { pattern: /you paid \$[\d,]+\.?\d*/i, type: "expense", category: "Expense", weight: 85 },
  { pattern: /invoice #[\w\d-]+|invoice (paid|received)/i, type: "expense", category: "Bills", weight: 80 },
  { pattern: /(utility|electric|water|gas|internet|phone) bill/i, type: "expense", category: "Utilities", weight: 85 },
];

// Specific well-known services (high confidence)
const SERVICE_PATTERNS: Array<{ 
  pattern: RegExp; 
  name: string; 
  category: string; 
  weight: number;
  description?: string;
}> = [
  { pattern: /microsoft (365|office|basic)/i, name: "Microsoft 365", category: "Software", weight: 95, description: "Microsoft 365 subscription for Office apps and cloud services" },
  { pattern: /netflix/i, name: "Netflix", category: "Entertainment", weight: 95, description: "Netflix streaming service subscription" },
  { pattern: /spotify/i, name: "Spotify", category: "Entertainment", weight: 95, description: "Spotify music streaming subscription" },
  { pattern: /amazon prime/i, name: "Amazon Prime", category: "Shopping", weight: 95, description: "Amazon Prime membership" },
  { pattern: /apple music/i, name: "Apple Music", category: "Entertainment", weight: 95, description: "Apple Music streaming subscription" },
  { pattern: /youtube (premium|music)/i, name: "YouTube Premium", category: "Entertainment", weight: 95, description: "YouTube Premium subscription" },
  { pattern: /adobe (creative cloud|acrobat)/i, name: "Adobe", category: "Software", weight: 95, description: "Adobe Creative Cloud or Acrobat subscription" },
  { pattern: /google (workspace|one|drive)/i, name: "Google Workspace", category: "Software", weight: 95, description: "Google Workspace or Google One subscription" },
  { pattern: /dropbox/i, name: "Dropbox", category: "Storage", weight: 95, description: "Dropbox cloud storage subscription" },
  { pattern: /slack/i, name: "Slack", category: "Productivity", weight: 95, description: "Slack team communication subscription" },
  { pattern: /zoom/i, name: "Zoom", category: "Communication", weight: 95, description: "Zoom video conferencing subscription" },
  { pattern: /github/i, name: "GitHub", category: "Development", weight: 95, description: "GitHub code repository subscription" },
  { pattern: /figma/i, name: "Figma", category: "Design", weight: 95, description: "Figma design tool subscription" },
  { pattern: /notion/i, name: "Notion", category: "Productivity", weight: 95, description: "Notion workspace subscription" },
  { pattern: /canva/i, name: "Canva", category: "Design", weight: 95, description: "Canva design platform subscription" },
  { pattern: /disney\+|disney plus/i, name: "Disney+", category: "Entertainment", weight: 95, description: "Disney+ streaming subscription" },
  { pattern: /hulu/i, name: "Hulu", category: "Entertainment", weight: 95, description: "Hulu streaming subscription" },
  { pattern: /hbo max/i, name: "HBO Max", category: "Entertainment", weight: 95, description: "HBO Max streaming subscription" },
  { pattern: /audible/i, name: "Audible", category: "Entertainment", weight: 95, description: "Audible audiobook subscription" },
  { pattern: /icloud/i, name: "iCloud", category: "Storage", weight: 95, description: "iCloud storage subscription" },
];

// More precise amount extraction - look for amounts near financial keywords
const CONTEXTUAL_AMOUNT_PATTERNS = [
  // Amount with clear context
  /(?:total|amount|price|charged|paid|cost)[:\s]+\$?([\d,]+\.?\d{0,2})/gi,
  /\$?([\d,]+\.?\d{2})\s*(?:total|charged|paid|billed)/gi,
  // Standard currency formats
  /\$([\d,]+\.\d{2})/g,
  /USD\s*([\d,]+\.?\d{0,2})/gi,
];

function extractAmounts(text: string): number[] {
  const amounts: number[] = [];
  const seen = new Set<number>();
  
  // Try contextual patterns first (higher priority)
  for (const pattern of CONTEXTUAL_AMOUNT_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      
      // Only accept realistic amounts
      if (amount >= 0.99 && amount <= 9999 && !seen.has(amount)) {
        amounts.push(amount);
        seen.add(amount);
      }
    }
  }
  
  return amounts;
}

function extractOrderNumber(text: string): string | null {
  // Try to extract order number
  const orderPatterns = [
    /order\s*#\s*([\w\d-]+)/i,
    /order\s*number:?\s*([\w\d-]+)/i,
    /confirmation\s*#\s*([\w\d-]+)/i,
  ];
  
  for (const pattern of orderPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

function extractItemDetails(subject: string, body: string): string | null {
  // Try to extract what was ordered from common patterns
  const itemPatterns = [
    /ordered:?\s*(.+?)(?:\n|$)/i,
    /purchased:?\s*(.+?)(?:\n|$)/i,
    /item\(?s?\)?:?\s*(.+?)(?:\n|$)/i,
    /product\(?s?\)?:?\s*(.+?)(?:\n|$)/i,
  ];
  
  for (const pattern of itemPatterns) {
    const match = body.match(pattern);
    if (match && match[1].trim().length > 3 && match[1].trim().length < 100) {
      return match[1].trim();
    }
  }
  
  return null;
}

function detectServiceName(subject: string, body: string): { 
  name: string; 
  weight: number; 
  description: string | null;
} {
  const text = `${subject} ${body}`;
  
  // Check for known services first
  for (const service of SERVICE_PATTERNS) {
    if (service.pattern.test(text)) {
      return { 
        name: service.name, 
        weight: service.weight,
        description: service.description || null
      };
    }
  }
  
  // Extract vendor from email sender
  const fromMatch = body.match(/from:?\s*([A-Z][a-zA-Z0-9\s&.]{2,40}?)(?:\s*<|@|\n|$)/i);
  if (fromMatch) {
    const vendor = fromMatch[1].trim();
    return { 
      name: vendor, 
      weight: 70,
      description: null
    };
  }
  
  // Try to extract service name from common patterns
  const serviceMatch = text.match(/(?:subscription to|order from|payment to|purchase from)\s+([A-Z][a-zA-Z0-9\s&.]{2,40})/i);
  if (serviceMatch) {
    return { 
      name: serviceMatch[1].trim(), 
      weight: 65,
      description: null
    };
  }
  
  // Try extracting from subject line (often has company name)
  const subjectMatch = subject.match(/^([A-Z][a-zA-Z0-9\s&.]{2,40}?)(?:\s*[-–:|])/);
  if (subjectMatch) {
    return { 
      name: subjectMatch[1].trim(), 
      weight: 60,
      description: null
    };
  }
  
  return { name: "Unknown Service", weight: 30, description: null };
}

function categorizeByContent(subject: string, body: string): string | null {
  const text = `${subject} ${body}`.toLowerCase();
  
  // Specific category matching
  if (/streaming|netflix|spotify|hulu|disney|youtube|hbo/i.test(text)) return "Entertainment";
  if (/software|adobe|microsoft|office|app|saas|subscription/i.test(text)) return "Software";
  if (/cloud|storage|dropbox|drive|backup|icloud/i.test(text)) return "Storage";
  if (/restaurant|food|delivery|uber eats|doordash|grubhub|dining/i.test(text)) return "Food & Dining";
  if (/gas|fuel|transport|uber|lyft|parking|travel/i.test(text)) return "Transportation";
  if (/grocery|supermarket|walmart|target|whole foods/i.test(text)) return "Groceries";
  if (/utility|electric|water|internet|phone|cable|wifi/i.test(text)) return "Utilities";
  if (/insurance|health|medical|dental|vision/i.test(text)) return "Insurance";
  if (/gym|fitness|workout|yoga|health club/i.test(text)) return "Health & Fitness";
  if (/education|course|training|udemy|coursera|class/i.test(text)) return "Education";
  if (/clothing|apparel|fashion|shoes|accessories/i.test(text)) return "Clothing";
  if (/electronics|tech|computer|phone|gadget/i.test(text)) return "Electronics";
  if (/book|amazon|kindle|audible/i.test(text)) return "Books & Media";
  
  return null;
}

function buildDescription(
  type: "subscription" | "order" | "expense",
  serviceName: string,
  serviceDescription: string | null,
  subject: string,
  body: string,
  amount: number | null,
  orderNumber: string | null,
  itemDetails: string | null
): string {
  let description = "";
  
  if (type === "order") {
    description = `Order from ${serviceName}`;
    
    if (orderNumber) {
      description += ` (Order #${orderNumber})`;
    }
    
    if (itemDetails) {
      description += `. Items: ${itemDetails}`;
    }
    
    if (amount) {
      description += `. Total: $${amount.toFixed(2)}`;
    } else {
      description += ". Price to be confirmed.";
    }
  } else if (type === "subscription") {
    if (serviceDescription) {
      description = serviceDescription;
    } else {
      description = `${serviceName} subscription`;
    }
    
    if (amount) {
      description += ` - $${amount.toFixed(2)}`;
    }
  } else {
    // expense
    description = `Payment to ${serviceName}`;
    
    if (amount) {
      description += ` for $${amount.toFixed(2)}`;
    }
  }
  
  return description;
}

function calculateConfidence(
  subject: string, 
  body: string, 
  amounts: number[],
  matchedPattern: EmailPattern | null,
  serviceWeight: number,
  type: "subscription" | "order" | "expense"
): number {
  let confidence = 0;
  
  // Base confidence from pattern match
  if (matchedPattern) {
    confidence = matchedPattern.weight;
  } else {
    confidence = 20; // Very low base if no pattern
  }
  
  // Boost for recognized service
  if (serviceWeight >= 90) {
    confidence = Math.max(confidence, 85);
  } else if (serviceWeight >= 70) {
    confidence += 10;
  }
  
  // Amount validation - orders can have no amount
  if (type === "order") {
    // Orders are valid even without amounts
    if (amounts.length === 1) {
      confidence += 10; // Bonus for clear amount
    }
  } else {
    // Subscriptions and expenses need amounts
    if (amounts.length === 0) {
      confidence -= 30; // Heavy penalty for no amount
    } else if (amounts.length === 1) {
      confidence += 10; // Bonus for single clear amount
    } else if (amounts.length > 5) {
      confidence -= 10; // Penalty for too many amounts
    }
  }
  
  // Check for spam indicators
  const text = `${subject} ${body}`.toLowerCase();
  if (/unsubscribe|opt.out|promotional|advertisement|marketing/i.test(text)) {
    confidence -= 20;
  }
  
  // Boost for clear transaction language
  if (/thank you for your (purchase|payment|order)|receipt|confirmation/i.test(text)) {
    confidence += 10;
  }
  
  return Math.max(0, Math.min(100, confidence));
}

function analyzeEmail(email: any): DetectedItem | null {
  const { subject, body, from, date } = email;
  const fullText = `${subject} ${body}`;
  
  // First: Check for strong patterns
  let bestMatch: { pattern: EmailPattern; weight: number } | null = null;
  
  const allPatterns = [
    ...STRONG_SUBSCRIPTION_PATTERNS,
    ...STRONG_ORDER_PATTERNS,
    ...STRONG_EXPENSE_PATTERNS
  ];
  
  for (const pattern of allPatterns) {
    if (pattern.pattern.test(fullText)) {
      if (!bestMatch || pattern.weight > bestMatch.weight) {
        bestMatch = { pattern, weight: pattern.weight };
      }
    }
  }
  
  // If no strong pattern match, skip this email
  if (!bestMatch) {
    return null;
  }
  
  // Extract amounts
  const amounts = extractAmounts(fullText);
  
  // For orders, we allow no amount - just need confirmation
  // For subscriptions/expenses, we need an amount
  if (bestMatch.pattern.type !== "order" && amounts.length === 0) {
    return null;
  }
  
  // Detect service name and description
  const service = detectServiceName(subject, body);
  
  // Extract order details if applicable
  const orderNumber = extractOrderNumber(fullText);
  const itemDetails = extractItemDetails(subject, body);
  
  // Calculate confidence
  const confidence = calculateConfidence(
    subject, 
    body, 
    amounts, 
    bestMatch.pattern,
    service.weight,
    bestMatch.pattern.type
  );
  
  // Only return items with confidence >= 60
  if (confidence < 60) {
    return null;
  }
  
  // Use the most prominent amount (usually the largest for receipts)
  const amount = amounts.length > 0 ? Math.max(...amounts) : null;
  
  // Final sanity check on amount if present
  if (amount !== null && (amount < 0.50 || amount > 10000)) {
    return null;
  }
  
  const category = categorizeByContent(subject, body) || bestMatch.pattern.category;
  
  // Build detailed description
  const description = buildDescription(
    bestMatch.pattern.type,
    service.name,
    service.description,
    subject,
    body,
    amount,
    orderNumber,
    itemDetails
  );
  
  // Parse date
  const emailDate = date ? new Date(parseInt(date)) : new Date();
  
  return {
    id: `email_${email.id}_${Date.now()}`,
    emailId: email.id,
    type: bestMatch.pattern.type,
    name: service.name,
    category,
    amount: amount,
    currency: "USD",
    confidence,
    emailSubject: subject.substring(0, 100),
    selected: confidence >= 75, // Auto-select only high confidence items
    description,
    date: emailDate.toISOString().split('T')[0],
  };
}

async function getGmailEmails(accessToken: string): Promise<any[]> {
  try {
    const gmail = google.gmail({ version: 'v1' });
    
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    gmail.context._options.auth = oauth2Client;
    
    // Search last 30 days only
    const query = [
      'newer_than:30d', // Last 30 days only
      '(("order confirmation" OR "payment confirmation" OR "receipt" OR "subscription renewed" OR "order number" OR "invoice paid" OR "thank you for your order" OR "thank you for your purchase" OR "payment successful" OR "you paid" OR "order placed"))',
      '-label:spam -label:trash', // Exclude spam and trash
      'has:nouserlabels OR in:inbox' // Focus on inbox
    ].join(' ');
    
    console.log('Gmail query:', query);
    
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50 // Reasonable limit
    });
    
    if (!listResponse.data.messages) {
      return [];
    }
    
    console.log(`Found ${listResponse.data.messages.length} potential emails`);
    
    // Get full email details
    const emails = [];
    for (const message of listResponse.data.messages.slice(0, 50)) {
      try {
        const emailResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        });
        
        const email = emailResponse.data;
        const headers = email.payload?.headers || [];
        
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        
        // Extract email body
        let body = '';
        if (email.payload?.body?.data) {
          body = Buffer.from(email.payload.body.data, 'base64').toString();
        } else if (email.payload?.parts) {
          for (const part of email.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body += Buffer.from(part.body.data, 'base64').toString();
            }
          }
        }
        
        emails.push({
          id: email.id,
          subject,
          from,
          body: body.substring(0, 3000), // First 3000 chars
          date: email.internalDate
        });
        
      } catch (error) {
        console.error('Error fetching email:', error);
        continue;
      }
    }
    
    return emails;
    
  } catch (error) {
    console.error('Gmail API error:', error);
    throw new Error('Failed to access Gmail');
  }
}

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: "google" }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const googleAccount = user.accounts?.find(account => account.provider === "google");
    if (!googleAccount) {
      return NextResponse.json({ error: "Google account not connected" }, { status: 400 });
    }

    console.log(`Starting Gmail scan for user: ${user.email} (last 30 days)`);

    // Check if we have the necessary permissions
    if (!googleAccount.scope?.includes('gmail.readonly')) {
      return NextResponse.json({ 
        error: "Gmail access not granted. Please reconnect your Google account to grant Gmail permissions.",
        needsReauth: true 
      }, { status: 400 });
    }

    if (!googleAccount.access_token) {
      return NextResponse.json({ 
        error: "No access token available. Please reconnect your Google account.",
        needsReauth: true 
      }, { status: 400 });
    }

    try {
      let accessToken = googleAccount.access_token;
      
      // Check if token is expired and refresh if needed
      const isExpired = googleAccount.expires_at && googleAccount.expires_at * 1000 < Date.now();
      
      if (isExpired && googleAccount.refresh_token) {
        console.log('Access token expired, refreshing...');
        
        try {
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          
          oauth2Client.setCredentials({
            refresh_token: googleAccount.refresh_token
          });
          
          const { credentials } = await oauth2Client.refreshAccessToken();
          accessToken = credentials.access_token!;
          
          // Update the stored tokens
          await prisma.account.update({
            where: { id: googleAccount.id },
            data: {
              access_token: credentials.access_token,
              expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : undefined
            }
          });
          
          console.log('Token refreshed successfully');
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return NextResponse.json({ 
            error: "Failed to refresh access token. Please reconnect your Google account.",
            needsReauth: true 
          }, { status: 400 });
        }
      }
      
      // Get emails from Gmail
      const emails = await getGmailEmails(accessToken);
      console.log(`Retrieved ${emails.length} emails from Gmail`);
      
      // Analyze each email for financial data
      const detectedItems: DetectedItem[] = [];
      for (const email of emails) {
        const item = analyzeEmail(email);
        if (item) {
          detectedItems.push(item);
        }
      }
      
      console.log(`Detected ${detectedItems.length} high-confidence financial items`);
      
      const response = {
        success: true,
        items: detectedItems,
        summary: {
          total: detectedItems.length,
          subscriptions: detectedItems.filter(item => item.type === "subscription").length,
          orders: detectedItems.filter(item => item.type === "order").length,
          expenses: detectedItems.filter(item => item.type === "expense").length,
          withoutPrices: detectedItems.filter(item => item.amount === null).length,
        },
        message: `Found ${detectedItems.length} financial items in your Gmail (last 30 days, ${emails.length} emails scanned)`
      };

      return NextResponse.json(response);
      
    } catch (gmailError: unknown) {
      console.error("Gmail API error:", gmailError);
      
      const errorMessage = gmailError instanceof Error ? gmailError.message : String(gmailError);
      
      if (errorMessage.includes('authentication') || 
          errorMessage.includes('credential') ||
          errorMessage.includes('401')) {
        return NextResponse.json({ 
          error: "Gmail authentication failed. Please reconnect your Google account.",
          needsReauth: true 
        }, { status: 401 });
      }
      
      return NextResponse.json({
        success: false,
        error: "Failed to scan Gmail. Please try again.",
        details: errorMessage
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error scanning Gmail:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}