const { isAdminAuthorized } = require("../../../lib/admin-auth");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({ admin: isAdminAuthorized(req) });
}
