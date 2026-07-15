import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bmrLogSchema } from "@/lib/validation";
import { toLocalDateKey } from "@/lib/dates";
import { unauthorized } from "@/lib/apiErrors";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit") || 30), 90);
  const logs = await prisma.bmrLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: limit,
  });
  return NextResponse.json(logs);
}

// Deliberately does not write back to User.bmr - that field is recalculated
// from height/weight/age/gender on every profile save, so syncing it here
// would just get overwritten. BmrLog is its own independent history, used
// for the trend chart.
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const parsed = bmrLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const date = parsed.data.date || toLocalDateKey();
  const log = await prisma.bmrLog.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: { userId: session.user.id, date, bmr: parsed.data.bmr },
    update: { bmr: parsed.data.bmr },
  });

  return NextResponse.json(log);
}
