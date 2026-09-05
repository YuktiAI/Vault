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

module.exports = { uploadFile, saveLink, listFiles };
