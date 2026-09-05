const buckets = new Map();

function getClientAddress(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return (
    (forwarded ? forwarded.split(",")[0] : req.socket?.remoteAddress) ||
    "unknown"
  );
}

function allowRequest(req, { limit, windowMs }) {
  const now = Date.now();
  const key = `${getClientAddress(req)}:${limit}:${windowMs}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

module.exports = { allowRequest };
