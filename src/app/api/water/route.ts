import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { waterLogSchema } from "@/lib/validation";
import { toLocalDateKey } from "@/lib/dates";
import { unauthorized } from "@/lib/apiErrors";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const date = new URL(request.url).searchParams.get("date") || toLocalDateKey();
  const log = await prisma.waterLog.findUnique({
    where: { userId_date: { userId: session.user.id, date } },
  });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { waterTargetMl: true },
  });
  return NextResponse.json({
    date,
    ml: log?.ml ?? 0,
    targetMl: user?.waterTargetMl ?? 2000,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const parsed = waterLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const date = parsed.data.date || toLocalDateKey();
  const existing = await prisma.waterLog.findUnique({
    where: { userId_date: { userId: session.user.id, date } },
  });

  let ml: number;
  if (parsed.data.deltaMl != null) {
    ml = Math.max(0, (existing?.ml ?? 0) + parsed.data.deltaMl);
  } else {
    ml = parsed.data.ml ?? 0;
  }

  const log = await prisma.waterLog.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: { userId: session.user.id, date, ml },
    update: { ml },
  });

  return NextResponse.json(log);
}
