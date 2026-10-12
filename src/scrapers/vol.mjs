import * as cheerio from "cheerio";
import { fetchText, makeEvent } from "../lib/common.mjs";

const VENUE = "La Vol";
const VENUE_URL = "https://salavol.com";

export async function scrape() {
  const html = await fetchText("https://salavol.com/agenda/");
  const $ = cheerio.load(html);
  const events = [];

  $("a.dataModule").each((_, el) => {
    const $el = $(el);
    const leftDivs = $el.find(".dataModule__col--left > div");
    const dateText = $(leftDivs.get(1)).text().trim(); // "14/10/2026 19:45"
    const price = $(leftDivs.get(2)).text().trim() || null;

    const title = $el
      .find(".dataModule__col--right > div")
      .map((__, d) => $(d).text().trim())
      .get()
      .filter(Boolean)
      .join(" + ");

    const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/.exec(dateText);
    if (!title || !m || /cancel[·l]+at/i.test(title)) return;
    const [, day, month, year, hour, minute] = m;
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

    events.push(
      makeEvent({
        venue: VENUE,
        venueUrl: VENUE_URL,
        title,
        start,
        url: $el.attr("href") || VENUE_URL,
        image: null,
        price,
        source: "html-selectors",
      })
    );
  });

  return events;
}
