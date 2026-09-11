const crypto = require("crypto");

const ADMIN_SESSION_NAME = "vault_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function getAdminCookieValue(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith(`${ADMIN_SESSION_NAME}=`));

  if (!sessionCookie) {
    return null;
  }

  const value = sessionCookie.split("=").slice(1).join("=");
  return value ? decodeURIComponent(value) : null;
}

function constantTimeEquals(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    const aChar = a.charCodeAt(index) || 0;
    const bChar = b.charCodeAt(index) || 0;
    diff |= aChar ^ bChar;
  }

  return diff === 0;
}

function createAdminSessionToken(secret) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

function isAdminAuthorized(req) {
  const expectedToken = process.env.VAULT_ADMIN_KEY;
  if (!expectedToken) {
    return false;
  }

  const headerValue = req.headers["x-vault-admin-key"];
  const cookieValue = getAdminCookieValue(req);
  const submitted = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const expected = createAdminSessionToken(expectedToken);

  if (submitted && constantTimeEquals(submitted, expected)) {
    return true;
  }

  if (cookieValue && constantTimeEquals(cookieValue, expected)) {
    return true;
  }

  return false;
}

function getAdminSessionCookie(token) {
  const sessionValue = createAdminSessionToken(token);
  return `${ADMIN_SESSION_NAME}=${encodeURIComponent(sessionValue)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)};${process.env.NODE_ENV === "production" ? " Secure;" : ""}`;
}

module.exports = {
  ADMIN_SESSION_NAME,
  SESSION_TTL_MS,
  getAdminCookieValue,
  isAdminAuthorized,
  createAdminSessionToken,
  getAdminSessionCookie,
  constantTimeEquals,
};
