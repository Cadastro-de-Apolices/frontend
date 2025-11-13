"use client";

export type Role = "admin" | "visualizacao";
export type SessionUser = { email: string; name: string; role: Role };

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as SessionUser;
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getUser(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await res.json();
    return (data?.user as SessionUser) ?? null;
  } catch {
    return null;
  }
}

export async function isAdmin() {
  const u = await getUser();
  return u?.role === "admin";
}
