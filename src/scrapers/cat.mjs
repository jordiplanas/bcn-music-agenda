import * as cheerio from "cheerio";
import { fetchText, makeEvent } from "../lib/common.mjs";

const VENUE = "El CAT (Tradicionàrius)";
const VENUE_URL = "http://www.tradicionarius.cat";

export async function scrape() {
  const html = await fetchText("http://www.tradicionarius.cat/ca/programacio");
  const $ = cheerio.load(html);
  const events = [];

  $("li.promote_click").each((_, el) => {
    const $el = $(el);
    const title = $el.find(".title a").text().trim();
    const href = $el.find(".title a").attr("href");
    const datesText = $el.find(".dates").text().replace("Dates:", "").trim(); // "22/10/2026 a les 20.30 h"
    const image = $el.find("img").attr("src");

    const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+a\s+les\s+(\d{1,2})[.:](\d{2}))?/.exec(datesText);
    if (!title || !m) return;
    const [, day, month, year, hour = "0", minute = "0"] = m;
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

    events.push(
      makeEvent({
        venue: VENUE,
        venueUrl: VENUE_URL,
        title,
        start,
        url: href ? new URL(href, VENUE_URL).href : VENUE_URL,
        image: image ? new URL(image, VENUE_URL).href : null,
        price: null,
        source: "html-selectors",
      })
    );
  });

  return events;
}
