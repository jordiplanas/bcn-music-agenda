import { fetchJson, fetchText, makeEvent, MONTHS_CA_ES } from "../lib/common.mjs";

const VENUE = "L'Heliogàbal";
const VENUE_URL = "https://www.heliogabal.com";
const CONCERTS_CATEGORY_ID = 3; // "Concerts a l'Helio"

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DATE_RE = /(\d{1,2})\s+(gener|febrer|mar[çc]|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre)\s+(\d{4})\s+(\d{1,2})[:.](\d{2})\s*h/i;

export async function scrape() {
  const posts = await fetchJson(
    `https://www.heliogabal.com/wp-json/wp/v2/posts?categories=${CONCERTS_CATEGORY_ID}&per_page=40&_fields=id,slug,link,title`
  );

  const events = [];
  for (const post of posts) {
    try {
      const html = await fetchText(post.link);
      const text = stripTags(html);
      const m = DATE_RE.exec(text);
      if (!m) continue;
      const [, day, monthName, year, hour, minute] = m;
      const month = MONTHS_CA_ES[monthName.toLowerCase().replace("ç", "c")];
      if (!month) continue;
      const start = new Date(Number(year), month - 1, Number(day), Number(hour), Number(minute));
      const priceMatch = /(\d+(?:[.,]\d+)?)\s*€/.exec(text);
      const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

      events.push(
        makeEvent({
          venue: VENUE,
          venueUrl: VENUE_URL,
          title: post.title?.rendered?.replace(/&amp;/g, "&") || "",
          start,
          url: post.link,
          image: imgMatch ? imgMatch[1] : null,
          price: priceMatch ? `${priceMatch[1]}€` : null,
          source: "html-text-pattern",
        })
      );
    } catch {
      // page not reachable or pattern not found; skip this one
    }
  }
  return events;
}
