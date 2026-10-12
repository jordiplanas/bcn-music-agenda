const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

export async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

export async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

export function extractJsonLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const out = [];
  for (const b of blocks) {
    try {
      const data = JSON.parse(b.trim());
      const items = Array.isArray(data) ? data : [data];
      for (const it of items) {
        if (!it || typeof it !== "object") continue;
        if (it["@graph"]) out.push(...it["@graph"]);
        else out.push(it);
      }
    } catch {
      // ignore malformed JSON-LD block
    }
  }
  return out;
}

const MONTHS_CA = {
  gener: 1, febrer: 2, "març": 3, marc: 3, abril: 4, maig: 5, juny: 6,
  juliol: 7, agost: 8, setembre: 9, octubre: 10, novembre: 11, desembre: 12,
};
const MONTHS_ES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
export const MONTHS_CA_ES = { ...MONTHS_CA, ...MONTHS_ES };

// Builds an ISO datetime from loose day/month[/year] + optional time, inferring
// the year (and rolling to next year) when the source page omits it.
export function buildDate(day, month, year, hour = 0, minute = 0, now = new Date()) {
  const d = Number(day);
  const m = Number(month);
  let y = year ? Number(year) : now.getFullYear();
  let dt = new Date(y, m - 1, d, hour, minute, 0);
  if (!year) {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 2);
    if (dt < cutoff) {
      y += 1;
      dt = new Date(y, m - 1, d, hour, minute, 0);
    }
  }
  return dt;
}

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function makeEvent({ venue, venueUrl, title, start, url, image, price, source }) {
  return {
    id: slugify(`${venue}-${title}-${start ? start.toISOString().slice(0, 10) : "tbd"}`),
    venue,
    venueUrl,
    title: (title || "").trim(),
    start: start ? start.toISOString() : null,
    url: url || venueUrl,
    image: image || null,
    price: price || null,
    source,
  };
}
