const { saveLink } = require("../../lib/drive");
const { allowRequest } = require("../../lib/rate-limit");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!allowRequest(req, { limit: 20, windowMs: 60 * 1000 })) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const { url, note } = req.body || {};
  if (!url || typeof url !== "string" || url.length > 2048) {
    return res.status(400).json({ error: "A valid url is required" });
  }

  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: "Only HTTP and HTTPS links are allowed" });
    }

    const result = await saveLink({
      url,
      note: typeof note === "string" ? note.slice(0, 5000) : "",
    });

    return res.status(200).json({ ok: true, file: result });
  } catch (error) {
    console.error("Saving link failed:", error.message);
    return res.status(500).json({
      error: error.message === "Google Drive is not configured."
        ? error.message
        : "Saving link failed.",
    });
  }
}
