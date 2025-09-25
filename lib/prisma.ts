// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Only enable query logging in development when explicitly requested
const prismaClientSingleton = () => {
  // Determine log levels based on environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  const enableQueryLogging = process.env.PRISMA_LOG === 'true';

  if (isDevelopment && enableQueryLogging) {
    return new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }

  return new PrismaClient({
    log: ['error', 'warn'],
  });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}