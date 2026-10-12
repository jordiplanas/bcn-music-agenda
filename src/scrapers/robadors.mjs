import { fetchJson, makeEvent } from "../lib/common.mjs";

const VENUE = "23Robadors";
const VENUE_URL = "https://23robadors.com";

export async function scrape() {
  const data = await fetchJson("https://23robadors.com/wp-json/tribe/events/v1/events?per_page=50");
  return (data.events || []).map((ev) =>
    makeEvent({
      venue: VENUE,
      venueUrl: VENUE_URL,
      title: ev.title,
      start: ev.start_date ? new Date(ev.start_date.replace(" ", "T")) : null,
      url: ev.url,
      image: ev.image?.url,
      price: ev.cost || null,
      source: "tribe-events-api",
    })
  );
}
