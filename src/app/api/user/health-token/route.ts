import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateHealthSyncToken, hashHealthSyncToken } from "@/lib/healthToken";
import { unauthorized } from "@/lib/apiErrors";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { healthSyncTokenHash: true },
  });
  return NextResponse.json({ hasToken: !!user?.healthSyncTokenHash });
}

// Issue (or reissue) a token. The raw value is only ever returned here — the
// database stores just its hash, so a lost token can't be recovered, only replaced.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const token = generateHealthSyncToken();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { healthSyncTokenHash: hashHealthSyncToken(token) },
  });

  return NextResponse.json({ token });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { healthSyncTokenHash: null },
  });

  return NextResponse.json({ success: true });
}
