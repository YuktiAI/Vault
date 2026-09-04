const COOKIE_NAME = "vault_key";

// Reads the token from either the cookie or a ?key= query param.
function extractToken(req) {
  const fromQuery = req.query && req.query.key;
  if (fromQuery) return Array.isArray(fromQuery) ? fromQuery[0] : fromQuery;

  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function isAuthorized(req) {
  const token = extractToken(req);
  return Boolean(token) && token === process.env.ACCESS_KEY;
}

function setAuthCookie(res, token) {
  const oneYear = 60 * 60 * 24 * 365;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(
      token
    )}; Path=/; Max-Age=${oneYear}; HttpOnly; SameSite=Lax${secure}`
  );
}

module.exports = { isAuthorized, extractToken, setAuthCookie, COOKIE_NAME };
