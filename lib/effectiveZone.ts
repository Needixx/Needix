// lib/effectiveZone.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Returns the best timezone string for a user:
 *   1) User.timezone (IANA)
 *   2) 'tz' cookie (IANA)
 *   3) 'UTC' as a last resort
 */
export async function getEffectiveZone(userId?: string | null): Promise<string> {
  let zone: string | null = null;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    if (user?.timezone && user.timezone.includes("/")) zone = user.timezone;
  }

  if (!zone) {
    const jar = await cookies();
    const cookieTz = jar.get("tz")?.value ?? null;
    if (cookieTz && cookieTz.includes("/")) zone = cookieTz;
  }

  return zone ?? "UTC";
}
