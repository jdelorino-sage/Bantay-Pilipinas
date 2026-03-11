# Development Roadmap

## Phase 1 — Foundation ✅
- [x] Monorepo scaffold (shared / frontend / server workspaces)
- [x] Database migrations on Neon (001_initial.sql + 002_weather_advisories.sql)
- [x] RSS aggregator with circuit breakers (47 feeds, batch processing)
- [x] Fastify server with CORS, rate limiting, WebSocket
- [x] Health endpoint with real DB check
- [x] Deployment configs (Netlify netlify.toml, Railway Dockerfile)
- [x] Environment variable documentation (.env.example)

## Phase 2 — Core Data ✅
- [x] PAGASA scraper (typhoons + weather advisories + LPA detection)
- [x] PHIVOLCS scraper (earthquakes + volcanoes)
- [x] BSP economic data scraper (FX rates, BSP rate, inflation, PSEi via Finnhub)
- [x] GDELT fetcher with PH filter + memory store fallback
- [x] ACLED conflict event fetcher (30-day window)
- [x] Cron scheduler (RSS 60s, PHIVOLCS 5m, GDELT 15m, PAGASA 30m, BSP 30m, ACLED 1h)
- [x] deck.gl + MapLibre map with 12 PH layer groups (WPS, faults, cables, ports, etc.)
- [x] News panel with virtual scrolling + clustering

## Phase 3 — WPS Monitoring ✅
- [x] AIS vessel tracking (WebSocket with EEZ filtering)
- [x] MMSI-based vessel classification (CCG/PLAN/PAFMM/PHNavy/USNavy)
- [x] WPS Tension Score computation with DB-backed trend
- [x] WPS panel with vessel positions
- [x] WPS feature proximity detection (Scarborough, Ayungin, Pag-asa, etc.)
- [x] Strategic Posture panel (AIR + SEA counts by classification)

## Phase 4 — Intelligence ✅
- [x] AI summarization (4-tier: Anthropic → Groq → OpenRouter → Ollama)
- [x] Regional Stability Index (5 regions: NCR, BARMM, WPS, CAR, EV/Bicol)
- [x] AI Insights panel with PH Brief display
- [x] Risk Overview panel (weighted aggregate score)
- [x] Regional Instability panel (prominent top region + breakdown)

## Phase 5 — Dashboard & Testing (Current)
- [x] Three-column World Monitor-style layout (layer sidebar | map | right panels)
- [x] Live News panel (YouTube embeds: ABS-CBN, GMA, CNN PH, PTV, Rappler)
- [x] Layer toggle panel with search + time range filter
- [x] Map legend overlay
- [x] Enhanced header (alert level, PHT clock, search button)
- [x] Feed audit — removed dead feeds (CNN PH, Reuters RSS), updated PAGASA URLs
- [x] Test suite — 51 tests (stability scoring, WPS tension, vessel classification, GDELT categorization, feed validation, geo constants)
- [x] Mobile responsive CSS (1200px, 900px, 768px breakpoints)
- [ ] PWA with offline map tiles
- [ ] Filipino language support
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Sentry error tracking integration
