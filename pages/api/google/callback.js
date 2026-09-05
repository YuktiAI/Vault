const { google } = require("googleapis");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));
}

function getCookie(req, name) {
  const cookies = (req.headers.cookie || "")
    .split(";")
    .map((c) => c.trim());

  const cookie = cookies.find((c) => c.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing Google OAuth code or state.");
    }

    const savedState = getCookie(req, "google_oauth_state");

    if (!savedState || savedState !== state) {
      return res.status(400).send("Invalid OAuth state.");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res
        .status(400)
        .send("No refresh token received from Google.");
    }

    res.setHeader(
      "Set-Cookie",
      "google_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
    );
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Vault owner setup</title></head>
  <body>
    <h1>Google Drive setup complete</h1>
    <p>Copy this refresh token into Vercel as <strong>GOOGLE_REFRESH_TOKEN</strong>, then redeploy.</p>
    <textarea rows="4" cols="100" readonly>${escapeHtml(tokens.refresh_token)}</textarea>
    <p>This one-time response is not stored by Vault. Remove this page from your browser history after copying.</p>
  </body>
</html>`);
  } catch (error) {
    console.error("Google OAuth callback error:", error.message);
    res.status(500).send("Google authentication failed.");
  }
}
