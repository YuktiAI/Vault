const { isAuthorized } = require("../../lib/auth");
const { saveLink } = require("../../lib/drive");

function getCookie(req, name) {
  const cookies = (req.headers.cookie || "")
    .split(";")
    .map((c) => c.trim());

  const cookie = cookies.find((c) => c.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const refreshToken = getCookie(req, "google_refresh_token");

  if (!refreshToken) {
    return res.status(401).json({
      error: "Google Drive is not connected",
    });
  }

  const { url, note } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      error: "A url is required",
    });
  }

  try {
    const result = await saveLink({
      url,
      note,
      refreshToken,
    });

    return res.status(200).json({
      ok: true,
      file: result,
    });
  } catch (e) {
    console.error("Saving link failed:", e);

    return res.status(500).json({
      error: "Saving link failed: " + e.message,
    });
  }
}
