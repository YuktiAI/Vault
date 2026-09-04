const { isAuthorized } = require("../../lib/auth");
const { listFiles } = require("../../lib/drive");

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Not authorized" });
  }
  try {
    const files = await listFiles();
    return res.status(200).json({ files });
  } catch (e) {
    return res.status(500).json({ error: "Listing failed: " + e.message });
  }
}
