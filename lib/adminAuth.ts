import { createHmac, randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";

const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || "default_admin_secret";
const ADMIN_SESSION_COOKIE = "admin_session";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString(
    "hex",
  );
  return timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(hash, "hex"));
}

export function signAdminSession(adminId: string): string {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24h
  const payload = `${adminId}:${expiresAt}`;
  const signature = createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}:${signature}`;
}

export function verifyAdminSession(token: string): string | null {
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [adminId, expiresAtRaw, signature] = parts;
  const payload = `${adminId}:${expiresAtRaw}`;
  const expected = createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");

  if (
    !timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    )
  ) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null;
  }

  return adminId;
}

const ADMIN_PATH_SECRET =
  process.env.ADMIN_PATH_SECRET || "super-secret-admin-path";

export function adminSessionCookieName() {
  return ADMIN_SESSION_COOKIE;
}

export function verifyAdminPathSecret(secret?: string | null) {
  return Boolean(secret && secret === ADMIN_PATH_SECRET);
}
