const { listFiles, getFileMetadata, deleteFile, isFileDirectlyInVaultFolder } = require("../../lib/drive");
const { allowRequest } = require("../../lib/rate-limit");
const { isAdminAuthorized } = require("../../lib/admin-auth");

export default async function handler(req, res) {
  if (req.method === "GET") {
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

  if (req.method === "DELETE") {
    if (!allowRequest(req, { limit: 20, windowMs: 60 * 1000 })) {
      return res.status(429).json({ error: "Too many requests" });
    }

    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Admin access required." });
    }

    const fileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!fileId) {
      return res.status(400).json({ error: "Missing file id." });
    }

    try {
      const metadata = await getFileMetadata(fileId);
      if (!metadata || !isFileDirectlyInVaultFolder(metadata)) {
        return res.status(403).json({ error: "Cannot delete this file." });
      }

      await deleteFile(fileId);
      return res.status(200).json({ ok: true, deleted: fileId });
    } catch (error) {
      const message = error.message || "Delete failed.";
      const status = message === "File not found." ? 404 : message === "Cannot delete this file." ? 403 : 500;
      return res.status(status).json({ error: status === 500 ? "Delete failed." : message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
