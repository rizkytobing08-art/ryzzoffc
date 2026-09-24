const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== Konfigurasi komentar bersama (isi setelah setup Supabase, lihat panduan) =====
const SB_URL = "";   // contoh: "https://abcd1234.supabase.co"
const SB_KEY = "";   // anon public key

// ===== Halaman (navigasi tanpa reload) =====
const pages = [...document.querySelectorAll("main>section")];
function route() {
  const cur = pages.find(p => p.id === location.hash.slice(1)) || pages[0];
  pages.forEach(p => p.classList.toggle("on", p === cur));
  document.querySelectorAll("header a").forEach(a => a.setAttribute("aria-current", a.hash === "#" + cur.id ? "page" : "false"));
  scrollTo(0, 0);
}
addEventListener("hashchange", route); route();

// ===== Umur otomatis =====
const now = new Date();
let umur = now.getFullYear() - 2010;
if (now < new Date(now.getFullYear(), 6, 28)) umur--;
$("age").textContent = umur;
$("year").textContent = now.getFullYear();

// ===== Teks mengetik =====
const words = ["belajar web development", "siswa SMK TJKT", "membangun project kecil", "terus berkembang"];
const typed = $("typed");
if (reduce) typed.textContent = words[0];
else {
  let w = 0, c = 0, del = false;
  (function tick() {
    const word = words[w];
    typed.textContent = word.slice(0, c);
    if (!del && c === word.length) { del = true; return setTimeout(tick, 1400); }
    if (del && c === 0) { del = false; w = (w + 1) % words.length; }
    c += del ? -1 : 1;
    setTimeout(tick, del ? 35 : 70);
  })();
}

// ===== Latar anime: bintang berkedip dan kelopak sakura =====
const cv = $("net"), g = cv.getContext("2d");
let W, H, P = [], S = [];
const petal = fresh => ({ x: Math.random() * W, y: fresh ? Math.random() * H : -20, s: Math.random() * 6 + 5, vy: Math.random() * .8 + .5, vx: Math.random() * .6 - .1, a: Math.random() * 6, va: Math.random() * .03 });
function size() {
  W = cv.width = innerWidth; H = cv.height = innerHeight;
  P = Array.from({ length: Math.min(40, W / 30 | 0) }, () => petal(true));
  S = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H * .6, r: Math.random() * 1.4 + .4, t: Math.random() * 6 }));
}
addEventListener("resize", size); size();
function draw(t) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = "#fff";
  for (const s of S) { g.globalAlpha = .4 + .6 * Math.abs(Math.sin(t / 1000 + s.t)); g.fillRect(s.x, s.y, s.r, s.r); }
  g.globalAlpha = .85; g.fillStyle = "#ffb7d5";
  for (const p of P) {
    if (!reduce) { p.y += p.vy; p.x += p.vx + Math.sin(p.a) * .5; p.a += p.va; }
    if (p.y > H + 20) Object.assign(p, petal(false));
    g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.beginPath(); g.ellipse(0, 0, p.s, p.s * .55, 0, 0, 7); g.fill(); g.restore();
  }
  if (!reduce) requestAnimationFrame(draw);
}
draw(0); if (!reduce) requestAnimationFrame(draw);

// ===== Perbesar gambar kode =====
const lb = $("lb");
document.querySelectorAll("[data-full]").forEach(b => b.addEventListener("click", () => { lb.querySelector("img").src = b.dataset.full; lb.showModal(); }));
lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

// ===== Komentar dan rating =====
const online = SB_URL && SB_KEY;
const HD = { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" };
const local = () => { try { return JSON.parse(localStorage.getItem("cm") || "[]"); } catch { return []; } };
async function load() {
  if (!online) return local();
  const r = await fetch(SB_URL + "/rest/v1/comments?select=*&order=created_at.desc&limit=100", { headers: HD });
  if (!r.ok) throw 0; return r.json();
}
async function save(c) {
  if (online) {
    const r = await fetch(SB_URL + "/rest/v1/comments", { method: "POST", headers: { ...HD, Prefer: "return=minimal" }, body: JSON.stringify(c) });
    if (!r.ok) throw 0;
  } else localStorage.setItem("cm", JSON.stringify([{ ...c, created_at: new Date().toISOString() }, ...local()]));
}
$("demo").hidden = !!online;
$("stars").innerHTML = [5, 4, 3, 2, 1].map(v => `<input type="radio" name="r" id="r${v}" value="${v}" required><label for="r${v}" title="${v} bintang"><span aria-hidden="true">★</span><span class="sr" style="position:absolute;left:-9999px">${v} bintang</span></label>`).join("");
async function render() {
  let a = []; try { a = await load(); } catch { $("msg").textContent = "Komentar belum bisa dimuat."; }
  $("sum").textContent = a.length ? `★ ${(a.reduce((s, c) => s + c.rating, 0) / a.length).toFixed(1)} dari 5 (${a.length} rating)` : "Belum ada rating. Jadilah yang pertama!";
  $("list").replaceChildren(...a.map(c => {
    const d = document.createElement("div"), h = document.createElement("b"), s = document.createElement("small"), p = document.createElement("p");
    d.className = "cm"; h.textContent = c.name; p.textContent = c.message;
    s.textContent = "★".repeat(c.rating) + "☆".repeat(5 - c.rating) + "  " + new Date(c.created_at).toLocaleDateString("id-ID");
    d.append(h, s, p); return d;
  }));
}
$("form").addEventListener("submit", async e => {
  e.preventDefault();
  const say = t => $("msg").textContent = t;
  if (Date.now() - (+localStorage.getItem("last") || 0) < 30000) return say("Tunggu sebentar sebelum mengirim lagi.");
  try {
    await save({ name: $("nm").value.trim(), message: $("tx").value.trim(), rating: +e.target.r.value });
    localStorage.setItem("last", Date.now()); e.target.reset(); say("Terima kasih! Komentarmu sudah terkirim."); render();
  } catch { say("Gagal mengirim. Coba lagi nanti."); }
});
render();
