import { fetchJson, fetchText, extractJsonLd, makeEvent } from "../lib/common.mjs";

const VENUE = "Diobar";
const VENUE_URL = "https://diobarbcn.com";

export async function scrape() {
  const listings = await fetchJson(
    "https://diobarbcn.com/wp-json/wp/v2/event_listing?per_page=30&_fields=id,slug,title"
  );

  const events = [];
  for (const item of listings) {
    const pageUrl = `${VENUE_URL}/event/${item.slug}/`;
    try {
      const html = await fetchText(pageUrl);
      const ev = extractJsonLd(html).find((it) => it["@type"] === "Event");
      if (!ev) continue;
      events.push(
        makeEvent({
          venue: VENUE,
          venueUrl: VENUE_URL,
          title: ev.name || item.title?.rendered,
          start: ev.startDate ? new Date(ev.startDate) : null,
          url: pageUrl,
          image: ev.image || null,
          price: ev.offers?.[0]?.price != null ? `${ev.offers[0].price}€` : null,
          source: "jsonld",
        })
      );
    } catch {
      // page not reachable or no structured data; skip this one
    }
  }
  return events;
}
