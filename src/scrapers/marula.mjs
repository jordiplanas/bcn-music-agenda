import { fetchJson, fetchText, makeEvent, buildDate, MONTHS_CA_ES } from "../lib/common.mjs";

const VENUE = "Marula Café";
const VENUE_URL = "https://marulacafe.com";

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DATE_RE = /(\d{1,2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{1,2}):(\d{2})\s+a\s+\d{1,2}:\d{2}\s*\/\s*([^()\n]+)/i;

export async function scrape() {
  const listings = await fetchJson(
    "https://marulacafe.com/wp-json/wp/v2/evento?per_page=30&_fields=id,slug,title,link"
  );

  const events = [];
  for (const item of listings) {
    const pageUrl = item.link || `${VENUE_URL}/evento/${item.slug}/`;
    try {
      const html = await fetchText(pageUrl);
      const text = stripTags(html);
      const m = DATE_RE.exec(text);
      if (!m) continue;
      const [, day, month, hour, minute, price] = m;
      const start = buildDate(day, MONTHS_CA_ES[month.toLowerCase()], null, Number(hour), Number(minute));
      const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
      events.push(
        makeEvent({
          venue: VENUE,
          venueUrl: VENUE_URL,
          title: item.title?.rendered?.replace(/&amp;/g, "&") || "",
          start,
          url: pageUrl,
          image: imgMatch ? imgMatch[1] : null,
          price: price.trim() || null,
          source: "html-text-pattern",
        })
      );
    } catch {
      // page not reachable or pattern not found; skip this one
    }
  }
  return events;
}
