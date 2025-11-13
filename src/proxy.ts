// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "./lib/auth-server";

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // liberar login, assets estáticos e API de login
  const publicPaths = [
    "/login",
    "/api/auth/login",
    "/api/auth/me",
    "/api/auth/logout",
    "/favicon.ico",
  ];

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isStatic =
    pathname.startsWith("/_next") || pathname.startsWith("/images");

  if (isPublic || isStatic) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("from", pathname + search);
    return NextResponse.redirect(url);
  }

  try {
    await verifySession(token);
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next|images|favicon.ico).*)"],
};
