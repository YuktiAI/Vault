const { google } = require("googleapis");
const fs = require("fs");

function getAuth() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error("Google Drive is not configured.");
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

function isVaultFolderId(value) {
  return !!value && String(value).trim() === String(process.env.DRIVE_FOLDER_ID || "").trim();
}

function isFileDirectlyInVaultFolder(file) {
  if (!file || !file.parents) return false;
  return file.parents.some((parentId) => isVaultFolderId(parentId));
}

async function getFileMetadata(fileId) {
  const normalizedId = String(fileId || "").trim();
  if (!normalizedId) {
    throw new Error("File not found.");
  }

  const file = await getDrive().files.get({
    fileId: normalizedId,
    fields: "id, name, mimeType, size, createdTime, parents",
  });

  return file.data || null;
}

async function uploadFile({ tempPath, filename, mimeType }) {
  const res = await getDrive().files.create({
    requestBody: {
      name: filename,
      parents: [process.env.DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: mimeType || "application/octet-stream",
      body: fs.createReadStream(tempPath),
    },
    fields: "id, name, webViewLink, size, createdTime",
  });

  return res.data;
}

async function saveLink({ url, note }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const body = note ? `${url}\n\n${note}\n` : `${url}\n`;

  const res = await getDrive().files.create({
    requestBody: {
      name: `link-${timestamp}.txt`,
      parents: [process.env.DRIVE_FOLDER_ID],
      mimeType: "text/plain",
    },
    media: { mimeType: "text/plain", body },
    fields: "id, name, webViewLink, createdTime",
  });

  return res.data;
}

async function listFiles() {
  const res = await getDrive().files.list({
    q: `'${process.env.DRIVE_FOLDER_ID}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, size, createdTime, webViewLink)",
    orderBy: "createdTime desc",
    pageSize: 50,
  });

  return res.data.files || [];
}

async function downloadFile(fileId) {
  const metadata = await getFileMetadata(fileId);
  if (!metadata) {
    throw new Error("File not found.");
  }

  if (metadata.mimeType === "application/vnd.google-apps.folder" || !isFileDirectlyInVaultFolder(metadata)) {
    throw new Error("File not available.");
  }

  const response = await getDrive().files.get(
    { fileId: metadata.id, alt: "media" },
    { responseType: "stream" }
  );

  return { metadata, stream: response.data };
}

async function deleteFile(fileId) {
  const metadata = await getFileMetadata(fileId);
  if (!metadata) {
    throw new Error("File not found.");
  }

  if (metadata.mimeType === "application/vnd.google-apps.folder" || !isFileDirectlyInVaultFolder(metadata)) {
    throw new Error("Cannot delete this file.");
  }

  await getDrive().files.delete({ fileId: metadata.id });
  return metadata;
}

module.exports = {
  uploadFile,
  saveLink,
  listFiles,
  getFileMetadata,
  downloadFile,
  deleteFile,
  isVaultFolderId,
  isFileDirectlyInVaultFolder,
};
