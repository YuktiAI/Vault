const { formidable } = require("formidable");
const fs = require("fs/promises");
const { uploadFile } = require("../../lib/drive");
const { allowRequest } = require("../../lib/rate-limit");

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!allowRequest(req, { limit: 10, windowMs: 60 * 60 * 1000 })) {
    return res.status(429).json({ error: "Upload limit reached. Try again later." });
  }

  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: 100 * 1024 * 1024,
    allowEmptyFiles: false,
  });

  form.parse(req, async (error, fields, files) => {
    let tempPath;
    try {
      if (error) {
        return res.status(400).json({ error: "Upload parse failed." });
      }

      const file = files.file && (Array.isArray(files.file) ? files.file[0] : files.file);
      if (!file || !file.filepath || !file.originalFilename) {
        return res.status(400).json({ error: "A file is required." });
      }

      tempPath = file.filepath;
      const filename = file.originalFilename.replace(/[\\/\0]/g, "_").slice(0, 255);
      if (!filename) {
        return res.status(400).json({ error: "The file name is invalid." });
      }

      const result = await uploadFile({
        tempPath,
        filename,
        mimeType: file.mimetype || "application/octet-stream",
      });

      return res.status(200).json({ ok: true, file: result });
    } catch (caughtError) {
      console.error("Drive upload failed:", caughtError.message);
      return res.status(500).json({
        error: caughtError.message === "Google Drive is not configured."
          ? caughtError.message
          : "Drive upload failed.",
      });
    } finally {
      if (tempPath) {
        await fs.rm(tempPath, { force: true }).catch(() => {});
      }
    }
  });
}
