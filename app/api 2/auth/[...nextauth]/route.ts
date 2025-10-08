// app/api/auth/[...nextauth]/route.ts
export { GET, POST } from '@/lib/auth';

// Configure for Node.js runtime to avoid edge runtime issues with Prisma
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';