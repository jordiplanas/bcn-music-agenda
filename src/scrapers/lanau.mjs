import * as cheerio from "cheerio";
import { fetchText, makeEvent, buildDate, MONTHS_CA_ES } from "../lib/common.mjs";

const VENUE = "La Nau";
const VENUE_URL = "https://lanaubarcelona.es";

const FECHA_RE = /(\d{1,2})\s+de\s+([a-zçàéèíòóú]+)/i;

export async function scrape() {
  const html = await fetchText("https://lanaubarcelona.es/ca/agenda/");
  const $ = cheerio.load(html);
  const events = [];

  $(".agenda-item").each((_, el) => {
    const $el = $(el);
    const fechaRaw = $el.find(".agenda-item__fecha").clone().children().remove().end().text().trim();
    const horaRaw = $el.find(".agenda-item__hora").text().trim(); // ", 21:00"
    const title = $el.find(".agenda-item__artista").text().trim();
    const url = $el.find("a.agenda-item__link").attr("href") || VENUE_URL;
    const image = $el.find("img").attr("src") || null;

    const m = FECHA_RE.exec(fechaRaw);
    if (!title || !m) return;
    const [, day, monthName] = m;
    const month = MONTHS_CA_ES[monthName.toLowerCase()];
    if (!month) return;
    const horaMatch = /(\d{1,2}):(\d{2})/.exec(horaRaw);
    const hour = horaMatch ? Number(horaMatch[1]) : 0;
    const minute = horaMatch ? Number(horaMatch[2]) : 0;
    const start = buildDate(day, month, null, hour, minute);

    events.push(
      makeEvent({
        venue: VENUE,
        venueUrl: VENUE_URL,
        title,
        start,
        url,
        image,
        price: null,
        source: "html-selectors",
      })
    );
  });

  return events;
}
