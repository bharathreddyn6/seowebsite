# RankPro SEO Analytics — Python Backend (FastAPI)

A production-ready FastAPI backend that powers the RankPro-style SEO dashboard shown in your screenshots.
It provides endpoints for:

- **/api/analyze** — Crawl and analyze a URL (SEO, Brand, Social).
- **/api/summary** — KPI summary (SEO score, organic traffic, keyword rankings, backlinks).
- **/api/issues** — SEO issues (missing meta, slow pages, broken internal links, missing alt tags).
- **/api/rankings** — Detailed rankings (keywords & simple "rank" heuristic).
- **/api/trends** — KPI trend data for time ranges (7/30/90 days) and categories.
- **/api/export/csv** & **/api/export/json** — Export latest analysis results.
- **/ws/progress** — WebSocket that streams analysis progress updates.
- **/health** — Health check.

## Quick Start

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open your frontend and point its API base URL to `http://localhost:8000`.
(If hosting on Replit or another service, use that origin and enable CORS in `main.py`.)

## Example (cURL)

```bash
curl -X POST http://localhost:8000/api/analyze       -H "Content-Type: application/json"       -d '{"url":"https://example.com","categories":["seo","brand","social"]}'
```

## Notes

- This backend performs **real HTTP fetches** and page parsing with BeautifulSoup.
  It checks internal links for breakage and counts alt tags, meta description, etc.
- KPI scoring is lightweight and heuristic-based to keep the app fast and self-contained.
- Data is stored in SQLite (`seo.db`) via SQLAlchemy for trends & exporting.
- WebSocket `/ws/progress?job_id=...` streams progress (10%, 35%, 70%, 100%).

## Project Structure

- `main.py` — FastAPI app, routes, WebSocket, CORS.
- `analysis.py` — Core analyzers for SEO/Brand/Social.
- `models.py` — SQLAlchemy models & Pydantic schemas.
- `database.py` — DB engine & session management.
- `utils.py` — Helpers: URL utils, scoring, text cleaning.
- `sample.http` — Ready-made HTTP requests for testing.
