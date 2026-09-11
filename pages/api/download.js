const { downloadFile } = require("../../lib/drive");
const { allowRequest } = require("../../lib/rate-limit");

function getContentType(filename, mimeType) {
  if (mimeType) return mimeType;
  const lower = String(filename || "").toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (lower.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!allowRequest(req, { limit: 60, windowMs: 60 * 1000 })) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const fileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!fileId) {
    return res.status(400).json({ error: "Missing file id." });
  }

  try {
    const { metadata, stream } = await downloadFile(fileId);
    const fileName = metadata.name || "download";

    res.setHeader("Content-Type", getContentType(fileName, metadata.mimeType));
    res.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/"/g, "\"")}"`);
    res.setHeader("Cache-Control", "no-store");

    await new Promise((resolve, reject) => {
      stream.on("error", reject);
      stream.on("end", resolve);
      stream.pipe(res);
    });
    return;
  } catch (error) {
    const message = error.message || "Download failed.";
    const status = message === "File not found." ? 404 : message === "File not available." ? 403 : 500;
    const safeError = status === 500 ? "Download failed." : message;
    if (!res.headersSent) {
      return res.status(status).json({ error: safeError });
    }
    return res.end();
  }
}
