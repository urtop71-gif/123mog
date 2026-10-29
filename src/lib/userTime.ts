import { prisma } from "@/lib/prisma";
import { resolveTimeZone } from "@/lib/dates";

export async function timeZoneForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return resolveTimeZone(user?.timezone);
}
