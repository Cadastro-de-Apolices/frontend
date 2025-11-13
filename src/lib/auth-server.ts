import { SignJWT, jwtVerify } from "jose";

type Role = "admin" | "visualizacao";

export type EnvUser = {
  email: string;
  name: string;
  role: Role;
  password?: string;       // senha em texto vindo do .env
};

const enc = new TextEncoder();

function getJwtSecret() {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s) throw new Error("AUTH_JWT_SECRET ausente no .env");
  return enc.encode(s);
}

export function getSessionMaxAgeMs() {
  const days = Number(process.env.AUTH_SESSION_DAYS || "7");
  return days * 24 * 60 * 60 * 1000;
}

export function getUsers(): EnvUser[] {
  try {
    const raw = process.env.AUTH_USERS;
    if (!raw) return [];
    const arr = JSON.parse(raw) as EnvUser[];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error("Erro ao parsear AUTH_USERS:", e);
    return [];
  }
}

export async function verifyPassword(plain: string, user: EnvUser) {
  // por enquanto, senha em texto puro
  if (!user.password) return false;
  return plain === user.password;
}

export type JwtPayload = {
  email: string;
  name: string;
  role: Role;
};

export async function signSession(payload: JwtPayload) {
  const maxAgeMs = getSessionMaxAgeMs();
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + maxAgeMs) / 1000))
    .sign(getJwtSecret());
  return jwt;
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as unknown as JwtPayload;
}
