import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { exerciseLogSchema } from "@/lib/validation";
import { toLocalDateKey } from "@/lib/dates";
import { unauthorized } from "@/lib/apiErrors";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const date = new URL(request.url).searchParams.get("date") || toLocalDateKey();
  const log = await prisma.exerciseLog.findUnique({
    where: { userId_date: { userId: session.user.id, date } },
  });
  return NextResponse.json({
    date,
    calories: log?.calories ?? 0,
    source: log?.source ?? null,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const parsed = exerciseLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const date = parsed.data.date || toLocalDateKey();
  const log = await prisma.exerciseLog.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: { userId: session.user.id, date, calories: parsed.data.calories, source: "manual" },
    update: { calories: parsed.data.calories, source: "manual" },
  });

  return NextResponse.json(log);
}
