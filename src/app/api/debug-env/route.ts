import { NextResponse } from "next/server";

// TEMPORARY diagnostic endpoint - remove after debugging the Vercel deployment.
// Never exposes the full secret value, only whether it's set and its scheme prefix.
export async function GET() {
  const url = process.env.DATABASE_URL;
  return NextResponse.json({
    hasUrl: !!url,
    length: url?.length ?? 0,
    prefix: url?.slice(0, 12) ?? null,
    startsWithLibsql: url?.startsWith("libsql:") ?? false,
    startsWithFile: url?.startsWith("file:") ?? false,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
