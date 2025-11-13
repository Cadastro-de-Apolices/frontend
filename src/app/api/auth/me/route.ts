import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth-server";

export async function GET(req: Request) {
  const cookie = (req as any).cookies?.get?.("session")?.value
    ?? (req.headers.get("cookie") || "").split("; ").find(c => c.startsWith("session="))?.split("=")[1];

  if (!cookie) return NextResponse.json({ user: null }, { status: 200 });

  try {
    const payload = await verifySession(cookie);
    return NextResponse.json({ user: payload });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
