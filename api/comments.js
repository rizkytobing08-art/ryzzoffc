const U = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const T = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const cmd = (...a) => fetch(U, { method: "POST", headers: { Authorization: `Bearer ${T}` }, body: JSON.stringify(a) }).then(r => r.json());

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  // Belum terhubung ke database: website tetap jalan dalam mode contoh
  if (!U || !T) return req.method === "POST" ? res.status(503).json({ demo: true }) : res.status(200).json({ demo: true, items: [] });
  try {
    if (req.method === "GET") {
      const { result } = await cmd("LRANGE", "comments", 0, 99);
      return res.status(200).json({ items: (result || []).map(s => JSON.parse(s)) });
    }
    if (req.method === "POST") {
      let b = req.body;
      if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
      const name = String(b?.name ?? "").trim().slice(0, 40), message = String(b?.message ?? "").trim().slice(0, 500), rating = Number(b?.rating);
      if (!name || !message || !Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: "invalid" });
      const ip = String(req.headers["x-forwarded-for"] || "x").split(",")[0].trim();
      const ok = (await cmd("SET", "rl:" + ip, 1, "NX", "EX", 30)).result;
      if (!ok) return res.status(429).json({ error: "slow" });
      await cmd("LPUSH", "comments", JSON.stringify({ name, message, rating, at: Date.now() }));
      await cmd("LTRIM", "comments", 0, 499);
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: "method" });
  } catch {
    res.status(500).json({ error: "server" });
  }
};
