const { formidable } = require("formidable");
const { isAuthorized } = require("../../lib/auth");
const { uploadFile } = require("../../lib/drive");

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const form = formidable({
    multiples: false,
    maxFileSize: 100 * 1024 * 1024, // 100MB — see README for going beyond this
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Upload parse failed: " + err.message });
    }
    const file = files.file && (Array.isArray(files.file) ? files.file[0] : files.file);
    if (!file) {
      return res.status(400).json({ error: "No file included in request" });
    }
    try {
      const result = await uploadFile({
        tempPath: file.filepath,
        filename: file.originalFilename || "upload",
        mimeType: file.mimetype,
      });
      return res.status(200).json({ ok: true, file: result });
    } catch (e) {
      return res.status(500).json({ error: "Drive upload failed: " + e.message });
    }
  });
}
