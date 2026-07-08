import { NextRequest, NextResponse } from "next/server";
import { revokeCurrentSession, SESSION_COOKIE } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await revokeCurrentSession();
  } catch {
    // cookie clearing below still logs the browser out; the row expires anyway
  }
  const res = NextResponse.redirect(new URL("/", req.nextUrl.origin), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
