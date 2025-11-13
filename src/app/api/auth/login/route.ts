import { NextResponse } from "next/server";
import { getUsers, signSession, verifyPassword } from "@/lib/auth-server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const users = getUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  const ok = await verifyPassword(password, user);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  const token = await signSession({
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const res = NextResponse.json({
    ok: true,
    user: { email: user.email, name: user.name, role: user.role },
  });

  const maxAge = Number(process.env.AUTH_SESSION_DAYS || "7") * 24 * 60 * 60;

  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return res;
}
