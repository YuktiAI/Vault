const { allowRequest } = require("../../../lib/rate-limit");
const { getAdminSessionCookie, isAdminAuthorized, constantTimeEquals } = require("../../../lib/admin-auth");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!allowRequest(req, { limit: 10, windowMs: 60 * 1000 })) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const providedKey = req.body && typeof req.body === "object" ? req.body.key : undefined;
  const expectedKey = process.env.VAULT_ADMIN_KEY;

  if (!expectedKey) {
    return res.status(500).json({ error: "Admin login is not configured." });
  }

  if (!providedKey || !constantTimeEquals(String(providedKey), expectedKey)) {
    return res.status(401).json({ error: "Invalid admin key." });
  }

  res.setHeader("Set-Cookie", getAdminSessionCookie(expectedKey));
  res.setHeader("Cache-Control", "no-store, private");
  return res.status(200).json({ ok: true, admin: true });
}
