const { listFiles } = require("../../lib/drive");
const { allowRequest } = require("../../lib/rate-limit");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!allowRequest(req, { limit: 60, windowMs: 60 * 1000 })) {
    return res.status(429).json({ error: "Too many requests" });
  }

  try {
    const files = await listFiles();
    return res.status(200).json({ files });
  } catch (error) {
    console.error("Listing failed:", error.message);
    return res.status(500).json({
      error: error.message === "Google Drive is not configured."
        ? error.message
        : "Listing failed.",
    });
  }
}
