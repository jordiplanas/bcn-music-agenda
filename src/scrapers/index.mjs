import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import * as robadors from "./robadors.mjs";
import * as deskomunal from "./deskomunal.mjs";
import * as diobar from "./diobar.mjs";
import * as marula from "./marula.mjs";
import * as lanau from "./lanau.mjs";
import * as cat from "./cat.mjs";
import * as heliogabal from "./heliogabal.mjs";
import * as vol from "./vol.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "..", "..", "docs", "data", "events.json");

const SCRAPERS = { robadors, deskomunal, diobar, marula, lanau, cat, heliogabal, vol };

async function run() {
  const results = {};
  const errors = {};
  let allEvents = [];

  for (const [name, mod] of Object.entries(SCRAPERS)) {
    process.stdout.write(`Scraping ${name}... `);
    try {
      const events = await mod.scrape();
      results[name] = events.length;
      allEvents.push(...events);
      console.log(`${events.length} events`);
    } catch (err) {
      errors[name] = err.message;
      console.log(`FAILED: ${err.message}`);
    }
  }

  // Drop events without a resolvable date or already in the past, dedupe, sort chronologically.
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 6);
  allEvents = allEvents.filter((e) => e.start && new Date(e.start) >= cutoff);
  const seen = new Set();
  allEvents = allEvents.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

  const payload = {
    generatedAt: new Date().toISOString(),
    counts: results,
    errors,
    events: allEvents,
  };

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`\nWrote ${allEvents.length} events -> ${OUT_FILE}`);
  if (Object.keys(errors).length) {
    console.log("Scrapers with errors:", errors);
  }
}

run();
