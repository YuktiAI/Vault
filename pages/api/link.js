const { isAuthorized } = require("../../lib/auth");
const { saveLink } = require("../../lib/drive");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const { url, note } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A url is required" });
  }

  try {
    const result = await saveLink({ url, note });
    return res.status(200).json({ ok: true, file: result });
  } catch (e) {
    return res.status(500).json({ error: "Saving link failed: " + e.message });
  }
}
