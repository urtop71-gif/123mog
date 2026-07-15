import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { healthSyncSchema } from "@/lib/validation";
import { hashHealthSyncToken } from "@/lib/healthToken";
import { toLocalDateKey } from "@/lib/dates";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { jsonError, unauthorized, tooMany } from "@/lib/apiErrors";

// POST /api/integrations/health-sync — token-authenticated endpoint for the
// iOS Shortcuts automation to push a day's HealthKit active-energy total.
// Not session-based: Shortcuts runs unattended and can't hold a browser session.
export async function POST(request: NextRequest) {
  if (!rateLimit(`health-sync:${clientIp(request)}`, 30, 10 * 60 * 1000)) {
    return tooMany();
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { healthSyncTokenHash: hashHealthSyncToken(token) },
    select: { id: true },
  });
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = healthSyncSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const date = parsed.data.date || toLocalDateKey();
  const log = await prisma.exerciseLog.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, calories: parsed.data.activeCalories, source: "healthkit" },
    update: { calories: parsed.data.activeCalories, source: "healthkit" },
  });

  return NextResponse.json({ date: log.date, calories: log.calories });
}
