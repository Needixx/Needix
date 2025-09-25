// scripts/fix-users.ts
// Run with: npx tsx scripts/fix-users.ts

import { prisma } from '../lib/prisma';

async function fixUsers() {
  try {
    console.log('Checking for users without proper setup...');
    
    // Find all sessions
    const sessions = await prisma.session.findMany({
      include: {
        user: true,
      },
    });

    console.log(`Found ${sessions.length} sessions`);

    // Check each session has a corresponding user
    for (const session of sessions) {
      if (!session.user) {
        console.log(`Session ${session.id} has no user, cleaning up...`);
        await prisma.session.delete({
          where: { id: session.id },
        });
      } else {
        console.log(`Session ${session.id} linked to user ${session.user.email}`);
      }
    }

    // Find orphaned accounts
    const accounts = await prisma.account.findMany({
      include: {
        user: true,
      },
    });

    for (const account of accounts) {
      if (!account.user) {
        console.log(`Account ${account.id} has no user, cleaning up...`);
        await prisma.account.delete({
          where: { id: account.id },
        });
      }
    }

    console.log('User cleanup complete!');
  } catch (error) {
    console.error('Error fixing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Mark the promise as intentionally not awaited to satisfy no-floating-promises
void fixUsers();
