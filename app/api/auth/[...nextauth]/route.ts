// app/api/auth/[...nextauth]/route.ts
import { GET, POST } from '@/lib/auth';

// Configure for Node.js runtime to avoid edge runtime issues with Prisma
export const runtime = 'nodejs';

// Export the handlers
export { GET, POST };