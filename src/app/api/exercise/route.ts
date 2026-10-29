import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { exerciseLogSchema } from "@/lib/validation";
import { toLocalDateKey } from "@/lib/dates";
import { timeZoneForUser } from "@/lib/userTime";
import { combineExerciseLogs } from "@/lib/exercise";
import { unauthorized } from "@/lib/apiErrors";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const timeZone = await timeZoneForUser(session.user.id);
  const date = new URL(request.url).searchParams.get("date") || toLocalDateKey(new Date(), timeZone);
  const logs = await prisma.exerciseLog.findMany({
    where: { userId: session.user.id, date },
    select: { source: true, calories: true },
  });
  const combined = combineExerciseLogs(logs);
  return NextResponse.json({ date, ...combined });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const parsed = exerciseLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const timeZone = await timeZoneForUser(session.user.id);
  const date = parsed.data.date || toLocalDateKey(new Date(), timeZone);
  await prisma.exerciseLog.upsert({
    where: { userId_date_source: { userId: session.user.id, date, source: "manual" } },
    create: { userId: session.user.id, date, calories: parsed.data.calories, source: "manual" },
    update: { calories: parsed.data.calories },
  });

  const logs = await prisma.exerciseLog.findMany({
    where: { userId: session.user.id, date },
    select: { source: true, calories: true },
  });
  return NextResponse.json({ date, ...combineExerciseLogs(logs) });
}
