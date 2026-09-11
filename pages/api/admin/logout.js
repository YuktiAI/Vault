const { ADMIN_SESSION_NAME } = require("../../../lib/admin-auth");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader(
    "Set-Cookie",
    `${ADMIN_SESSION_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax;${process.env.NODE_ENV === "production" ? " Secure;" : ""}`
  );
  res.setHeader("Cache-Control", "no-store, private");
  return res.status(200).json({ ok: true });
}
