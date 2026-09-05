const { google } = require("googleapis");

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

    res.setHeader("Set-Cookie", [
      `google_refresh_token=${encodeURIComponent(
        tokens.refresh_token
      )}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
      `google_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
    ]);

    res.redirect("/");
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    res.status(500).send("Google authentication failed.");
  }
}
