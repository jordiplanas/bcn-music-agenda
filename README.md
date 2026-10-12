# Agenda Música Barcelona

Calendario de conciertos en salas pequeñas de directo de Barcelona, generado automáticamente a partir de las webs de cada sala.

## Estructura

- `src/scrapers/` — un scraper por sala (API REST, JSON-LD o selectores HTML según lo que exponga cada web) + `index.mjs`, el orquestador que los corre todos, tolera fallos individuales y escribe `docs/data/events.json`.
- `docs/` — frontend estático (calendario con FullCalendar) + los datos generados. Es la carpeta que publica GitHub Pages.
- `server.mjs` — servidor local mínimo para previsualizar `docs/` tal cual se vería en producción.
- `.github/workflows/scrape.yml` — ejecuta el scraping cada día y commitea `docs/data/events.json` si hay cambios.

## Desarrollo local

```bash
npm install
npm run scrape     # genera docs/data/events.json
node server.mjs    # sirve docs/ en http://localhost:5500
```

## Salas cubiertas

Diobar, L'Heliogàbal, La Nau, La Deskomunal, El CAT (Tradicionàrius), 23Robadors, Marula Café.

Pendientes (requieren JS rendering o no tienen una agenda con fecha estructurada): La Vol, Oasys, L'Occulta, CC Albareda.
