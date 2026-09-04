const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || (() => {
    const file = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_FILE;
    if (!file) throw new Error("Google service account credentials are not set");
    return fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
  })();
  const credentials = JSON.parse(raw);
  return new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ["https://www.googleapis.com/auth/drive"]
  );
}

function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

// Uploads a file already saved to a temp path (from formidable) into the target folder.
async function uploadFile({ tempPath, filename, mimeType }) {
  const drive = getDrive();
  const res = await drive.files.create({
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

// Appends a saved link as its own small .txt file so it shows up in the folder listing.
async function saveLink({ url, note }) {
  const drive = getDrive();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const body = note ? `${url}\n\n${note}\n` : `${url}\n`;
  const res = await drive.files.create({
    requestBody: {
      name: `link-${timestamp}.txt`,
      parents: [process.env.DRIVE_FOLDER_ID],
      mimeType: "text/plain",
    },
    media: {
      mimeType: "text/plain",
      body,
    },
    fields: "id, name, webViewLink, createdTime",
  });
  return res.data;
}

async function listFiles() {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `'${process.env.DRIVE_FOLDER_ID}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, size, createdTime, webViewLink)",
    orderBy: "createdTime desc",
    pageSize: 50,
  });
  return res.data.files || [];
}

module.exports = { uploadFile, saveLink, listFiles };
