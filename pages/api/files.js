const { isAuthorized } = require("../../lib/auth");
const { listFiles } = require("../../lib/drive");

function getCookie(req, name) {
  const cookies = (req.headers.cookie || "")
    .split(";")
    .map((c) => c.trim());

  const cookie = cookies.find((c) => c.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const refreshToken = getCookie(req, "google_refresh_token");

  if (!refreshToken) {
    return res.status(401).json({
      error: "Google Drive is not connected",
    });
  }

  try {
    const files = await listFiles(refreshToken);
    return res.status(200).json({ files });
  } catch (e) {
    console.error("Listing failed:", e);

    return res.status(500).json({
      error: "Listing failed: " + e.message,
    });
  }
}
