// Add this file to your repo (e.g. /types/prisma-augment.d.ts)
// It augments PrismaClient so TS recognizes new models right away.
// This is a compile-time fix; it does not change runtime behavior.

import "@prisma/client";

declare module "@prisma/client" {
  interface PrismaClient {
    // Use 'unknown' to avoid eslint no-explicit-any;
    // your generated client will still provide the real types.
    pushSubscription: unknown;
    notificationSettings: unknown;
    notificationLog: unknown;
  }
}
