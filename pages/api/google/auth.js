const { google } = require("googleapis");
const crypto = require("crypto");

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  const setupKey = Array.isArray(req.query.setup)
    ? req.query.setup[0]
    : req.query.setup;
  if (!process.env.GOOGLE_SETUP_KEY || setupKey !== process.env.GOOGLE_SETUP_KEY) {
    return res.status(404).send("Not found");
  }

  const state = crypto.randomBytes(32).toString("hex");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive"],
    state,
  });

  res.setHeader(
    "Set-Cookie",
    `google_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`
  );

  res.redirect(authUrl);
}
