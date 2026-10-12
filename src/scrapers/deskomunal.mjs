import { fetchText, extractJsonLd, makeEvent } from "../lib/common.mjs";

const VENUE = "La Deskomunal";
const VENUE_URL = "https://ladeskomunal.coop";

function guessTime(description) {
  const m = /(\d{1,2})[.:](\d{2})\s*h\b/.exec(description || "");
  return m ? { hour: Number(m[1]), minute: Number(m[2]) } : { hour: 0, minute: 0 };
}

export async function scrape() {
  const html = await fetchText("https://ladeskomunal.coop/programacio/");
  const items = extractJsonLd(html).filter((it) => it["@type"] === "Event");
  return items.map((ev) => {
    let start = null;
    if (ev.startDate) {
      const { hour, minute } = guessTime(ev.description);
      start = new Date(`${ev.startDate}T00:00:00`);
      start.setHours(hour, minute, 0, 0);
    }
    return makeEvent({
      venue: VENUE,
      venueUrl: VENUE_URL,
      title: ev.name,
      start,
      url: ev.offers?.url || ev.url || VENUE_URL + "/programacio/",
      image: ev.image || null,
      price: ev.offers?.price ? `${ev.offers.price}€` : null,
      source: "jsonld",
    });
  });
}
