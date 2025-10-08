// app/api/auth/[...nextauth]/route.ts
export { GET, POST } from "@/lib/auth";

// Pin Node.js runtime to avoid Prisma/Edge issues.
// Next.js 15 expects 'nodejs' (not 'node').
export const runtime = "nodejs";
// Avoid caching; the session endpoint should always be dynamic.
export const dynamic = "force-dynamic";
