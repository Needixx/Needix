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
  amount: number;
  currency: string;
  interval?: string;
  date?: string;
  vendor?: string;
  merchant?: string;
  confidence: number;
  emailSubject: string;
  emailId: string;
  selected: boolean;
}

interface EmailPattern {
  pattern: RegExp;
  type: "subscription" | "order" | "expense";
  category: string;
}

// Enhanced patterns for detecting ANY financial activity - much more aggressive
const FINANCIAL_PATTERNS: EmailPattern[] = [
  // Subscription patterns - Enhanced with more variations
  { pattern: /subscription.*renew|subscription.*has.*been.*renewed|recurring.*payment|monthly.*billing|annual.*billing/i, type: "subscription", category: "Subscription" },
  { pattern: /auto.*pay|automatic.*payment|autopay|auto.*renew|auto.*renewal/i, type: "subscription", category: "Subscription" },
  { pattern: /your.*subscription.*to|subscription.*was.*successfully.*renewed|thanks.*for.*subscribing/i, type: "subscription", category: "Subscription" },
  { pattern: /membership.*renew|membership.*billing|membership.*fee/i, type: "subscription", category: "Membership" },
  
  // Order patterns - Much more comprehensive
  { pattern: /order.*confirmation|purchase.*receipt|order.*receipt|purchase.*confirmation/i, type: "order", category: "Shopping" },
  { pattern: /your.*order|order.*#|tracking.*number|shipped|delivered|order.*placed/i, type: "order", category: "Shopping" },
  { pattern: /bought|purchased|buying|ordering from|order from/i, type: "order", category: "Shopping" },
  { pattern: /thank.*you.*for.*your.*order|your.*purchase.*is.*complete/i, type: "order", category: "Shopping" },
  
  // Expense patterns - Cast wide net
  { pattern: /receipt|payment.*confirmation|transaction.*receipt|payment.*processed/i, type: "expense", category: "Expense" },
  { pattern: /bill.*payment|utility.*bill|statement|invoice.*paid/i, type: "expense", category: "Bills" },
  { pattern: /charged.*to.*your.*card|payment.*successful|transaction.*successful/i, type: "expense", category: "Expense" },
  { pattern: /thank.*you.*for.*your.*payment|payment.*received/i, type: "expense", category: "Expense" },
  
  // General financial activity - Very broad
  { pattern: /paid|charged|billed|invoiced|fee|cost|price|total|amount/i, type: "expense", category: "Financial" },
  { pattern: /renewal|renewed|renewing|expire|expiry|expires/i, type: "subscription", category: "Renewal" },
];

const AMOUNT_PATTERNS = [
  /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*USD/gi,
  /total.*?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /amount.*?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /charged.*?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /paid.*?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
];

// Specific service detection - Enhanced Microsoft patterns
const SERVICE_PATTERNS: Array<{ pattern: RegExp; name: string; category: string }> = [
  // Microsoft variations
  { pattern: /microsoft.*365|office.*365|microsoft.*basic|microsoft.*subscription/i, name: "Microsoft 365", category: "Software" },
  { pattern: /microsoft.*office|office.*subscription|office.*renewal/i, name: "Microsoft Office", category: "Software" },
  { pattern: /microsoft.*teams|teams.*subscription/i, name: "Microsoft Teams", category: "Communication" },
  { pattern: /microsoft.*onedrive|onedrive.*subscription/i, name: "Microsoft OneDrive", category: "Storage" },
  
  // Other services
  { pattern: /netflix/i, name: "Netflix", category: "Entertainment" },
  { pattern: /spotify/i, name: "Spotify", category: "Entertainment" },
  { pattern: /amazon.*prime/i, name: "Amazon Prime", category: "Shopping" },
  { pattern: /apple.*music/i, name: "Apple Music", category: "Entertainment" },
  { pattern: /adobe/i, name: "Adobe", category: "Software" },
  { pattern: /google.*workspace/i, name: "Google Workspace", category: "Software" },
  { pattern: /dropbox/i, name: "Dropbox", category: "Storage" },
  { pattern: /slack/i, name: "Slack", category: "Productivity" },
  { pattern: /zoom/i, name: "Zoom", category: "Communication" },
  { pattern: /github/i, name: "GitHub", category: "Development" },
  { pattern: /figma/i, name: "Figma", category: "Design" },
  { pattern: /notion/i, name: "Notion", category: "Productivity" },
  { pattern: /canva/i, name: "Canva", category: "Design" },
  { pattern: /linkedin.*premium/i, name: "LinkedIn Premium", category: "Professional" },
];

function extractAmounts(text: string): number[] {
  const amounts: number[] = [];
  
  for (const pattern of AMOUNT_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const amountStr = match[1];
      const amount = parseFloat(amountStr.replace(/,/g, ''));
      if (amount > 0 && amount < 10000) { // Reasonable range
        amounts.push(amount);
      }
    }
  }
  
  return [...new Set(amounts)]; // Remove duplicates
}

function detectServiceName(subject: string, body: string): { name: string; category: string } {
  const fullText = `${subject} ${body}`.toLowerCase();
  
  for (const service of SERVICE_PATTERNS) {
    if (service.pattern.test(fullText)) {
      return { name: service.name, category: service.category };
    }
  }
  
  // Fallback: extract from sender or subject
  const fromMatch = subject.match(/from\s+([A-Za-z\s]+)/i);
  if (fromMatch) {
    return { name: fromMatch[1].trim(), category: "Other" };
  }
  
  // Extract first word from subject as service name
  const firstWord = subject.split(' ')[0];
  return { name: firstWord || "Unknown Service", category: "Other" };
}

function categorizeByContent(subject: string, body: string): string {
  const text = `${subject} ${body}`.toLowerCase();
  
  if (/streaming|entertainment|music|video/i.test(text)) return "Entertainment";
  if (/software|app|tool|platform/i.test(text)) return "Software";
  if (/cloud|storage|backup/i.test(text)) return "Storage";
  if (/food|restaurant|delivery|uber.*eats|doordash/i.test(text)) return "Food & Dining";
  if (/gas|fuel|transport|uber|lyft/i.test(text)) return "Transportation";
  if (/grocery|supermarket|walmart|target/i.test(text)) return "Groceries";
  if (/utility|electric|water|internet|phone/i.test(text)) return "Utilities";
  if (/insurance|health|medical/i.test(text)) return "Insurance";
  if (/gym|fitness|health/i.test(text)) return "Health & Fitness";
  if (/education|course|training/i.test(text)) return "Education";
  
  return "Other";
}

function calculateConfidence(subject: string, body: string, amounts: number[]): number {
  let confidence = 40; // Base confidence
  
  const text = `${subject} ${body}`.toLowerCase();
  
  // Boost for financial keywords
  if (/payment|charged|billed|invoice|receipt/i.test(text)) confidence += 25;
  if (/total|amount|price|cost/i.test(text)) confidence += 15;
  if (amounts.length > 0) confidence += 20;
  
  // Boost for recognizable services
  if (SERVICE_PATTERNS.some(s => s.pattern.test(text))) confidence += 20;
  
  // Boost for clear transaction language
  if (/thank.*you.*purchase|confirmation|successful.*payment/i.test(text)) confidence += 15;
  
  return Math.min(95, confidence);
}

async function getGmailEmails(accessToken: string): Promise<any[]> {
  try {
    const gmail = google.gmail({ version: 'v1' });
    
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    gmail.context._options.auth = oauth2Client;
    
    // More aggressive search query to catch any financial activity
    const query = [
      'newer_than:3m', // Reduced to 3 months for faster processing
      '(payment OR receipt OR bill OR subscription OR order OR charged OR invoice OR autopay OR renewed OR subscribing OR purchased OR bought OR "has been renewed" OR "subscription to" OR "thanks for" OR "thank you for" OR billing OR "auto-renewal" OR "payment confirmation" OR "order confirmation" OR "purchase confirmation")',
      // Cast a wider net - don't limit by sender initially
      '-label:spam -label:trash -label:promotions', // Exclude obvious non-financial emails
      'has:nouserlabels OR in:inbox OR in:important' // Include unlabeled emails that might be financial
    ].join(' ');
    
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100 // Increased from 50 to catch more emails
    });
    
    if (!listResponse.data.messages) {
      return [];
    }
    
    // Get full email details - process more emails
    const emails = [];
    for (const message of listResponse.data.messages.slice(0, 50)) { // Process max 50 emails
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
            // Also check HTML parts for more content
            if (part.mimeType === 'text/html' && part.body?.data && !body) {
              body += Buffer.from(part.body.data, 'base64').toString();
            }
          }
        }
        
        emails.push({
          id: email.id,
          subject,
          from,
          body: body.substring(0, 2000), // Increased body length for better analysis
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

function analyzeEmail(email: any): DetectedItem | null {
  const { subject, body, from } = email;
  
  // Much more aggressive financial detection - check if ANY financial keywords exist
  const fullText = `${subject} ${body}`.toLowerCase();
  
  // First check: Does this email contain ANY financial keywords?
  const hasFinancialKeywords = [
    "payment", "charged", "billed", "paid", "invoice", "receipt", "transaction",
    "subscription", "order", "purchase", "bought", "billing", "renewal", "renewed",
    "fee", "cost", "price", "total", "amount", "$", "usd", "dollars"
  ].some((keyword: string) => fullText.includes(keyword));
  
  if (!hasFinancialKeywords) {
    return null; // Skip emails with no financial language
  }
  
  // Second check: Look for specific patterns
  let matchedPattern: { type: "subscription" | "order" | "expense"; category: string } | null = null;
  for (const pattern of FINANCIAL_PATTERNS) {
    if (pattern.pattern.test(fullText)) {
      matchedPattern = pattern;
      break;
    }
  }
  
  // If no specific pattern matches but has financial keywords, still try to extract
  if (!matchedPattern) {
    // Default to expense if we have financial keywords but no specific pattern
    matchedPattern = { type: "expense", category: "Financial" };
  }
  
  const amounts = extractAmounts(`${subject} ${body}`);
  
  // Be more lenient with amounts - even look for any number that might be a price
  if (amounts.length === 0) {
    // Try to find any numbers that could be amounts
    const numberMatches = fullText.match(/(\d+(?:\.\d{1,2})?)/g);
    if (numberMatches) {
      for (const match of numberMatches) {
        const num = parseFloat(match);
        if (num > 0.99 && num < 10000) { // Very broad range
          amounts.push(num);
        }
      }
    }
  }
  
  // If still no amounts, use a default based on type
  if (amounts.length === 0) {
    if (matchedPattern.type === "subscription") amounts.push(9.99);
    else if (matchedPattern.type === "order") amounts.push(25.00);
    else amounts.push(15.00);
  }
  
  const service = detectServiceName(subject, body);
  const category = categorizeByContent(subject, body) || matchedPattern.category;
  const type = matchedPattern.type;
  const confidence = calculateConfidence(subject, body, amounts);
  
  // Use the largest amount found (likely the main charge)
  const amount = Math.max(...amounts);
  
  return {
    id: `email_${email.id}_${Date.now()}`,
    emailId: email.id,
    type,
    name: service.name,
    category,
    amount,
    currency: "USD",
    confidence: Math.max(confidence, 60), // Minimum 60% confidence
    emailSubject: subject,
    selected: confidence >= 60, // Auto-select reasonable confidence items
  };
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

    console.log(`Starting REAL Gmail scan for user: ${user.email}`);
    console.log('Google account found:', {
      hasAccessToken: !!googleAccount.access_token,
      hasRefreshToken: !!googleAccount.refresh_token,
      expiresAt: googleAccount.expires_at,
      scope: googleAccount.scope
    });

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
      // Check if token is expired and refresh if needed
      let accessToken = googleAccount.access_token;
      
      if (googleAccount.expires_at && googleAccount.expires_at * 1000 < Date.now()) {
        console.log('Access token expired, attempting refresh...');
        
        if (!googleAccount.refresh_token) {
          return NextResponse.json({ 
            error: "Access token expired and no refresh token available. Please reconnect your Google account.",
            needsReauth: true 
          }, { status: 400 });
        }

        // Refresh the token
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
          
          // Update the database with new token
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
      
      // Get real emails from Gmail
      const emails = await getGmailEmails(accessToken);
      console.log(`Found ${emails.length} potential financial emails`);
      
      // Analyze each email for financial data
      const detectedItems: DetectedItem[] = [];
      for (const email of emails) {
        const item = analyzeEmail(email);
        if (item) {
          detectedItems.push(item);
        }
      }
      
      const response = {
        success: true,
        items: detectedItems,
        summary: {
          total: detectedItems.length,
          subscriptions: detectedItems.filter(item => item.type === "subscription").length,
          orders: detectedItems.filter(item => item.type === "order").length,
          expenses: detectedItems.filter(item => item.type === "expense").length,
        },
        message: `Found ${detectedItems.length} financial items in your Gmail`
      };

      console.log('Real Gmail scan completed:', response.summary);
      return NextResponse.json(response);
      
    } catch (gmailError: unknown) {
      console.error("Gmail API error:", gmailError);
      
      // Type-safe error checking
      const errorMessage = gmailError instanceof Error ? gmailError.message : String(gmailError);
      
      // Check if it's an auth error
      if (errorMessage.includes('authentication') || 
          errorMessage.includes('credential') ||
          errorMessage.includes('401')) {
        return NextResponse.json({ 
          error: "Gmail authentication failed. Please disconnect and reconnect your Google account in settings to grant Gmail access.",
          needsReauth: true 
        }, { status: 401 });
      }
      
      // Fallback to demo mode for other errors
      console.log("Falling back to demo mode due to Gmail API error");
      
      return NextResponse.json({
        success: true,
        items: [], // Return empty array instead of fake data
        summary: { total: 0, subscriptions: 0, orders: 0, expenses: 0 },
        message: "Gmail scanning temporarily unavailable. Please ensure Gmail access is properly configured.",
        demo: true
      });
    }

  } catch (error) {
    console.error("Error scanning Gmail:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}