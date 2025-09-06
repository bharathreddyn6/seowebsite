from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re, statistics, time, httpx, tldextract

USER_AGENT = "RankProBot/1.0 (+https://example.com/bot)"
REQUEST_TIMEOUT = 15.0

async def fetch_html(client: httpx.AsyncClient, url: str) -> tuple[str, float, int]:
    start = time.perf_counter()
    r = await client.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT, follow_redirects=True)
    elapsed = time.perf_counter() - start
    return r.text, elapsed, r.status_code

def is_internal(base_url: str, link: str) -> bool:
    try:
        base = tldextract.extract(base_url)
        l = tldextract.extract(link)
        return (base.domain, base.suffix) == (l.domain, l.suffix)
    except Exception:
        return False

async def check_link_ok(client: httpx.AsyncClient, link: str) -> bool:
    try:
        r = await client.head(link, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT, follow_redirects=True)
        if r.status_code >= 400:
            # Some servers don't support HEAD well; try GET lightweight
            r = await client.get(link, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT, follow_redirects=True)
        return r.status_code < 400
    except Exception:
        return False

def score_seo(meta_ok: bool, alt_ratio: float, broken_internal: int, ttfb: float) -> int:
    score = 100
    if not meta_ok:
        score -= 25
    # Alt ratio below 0.7 penalize linearly
    if alt_ratio < 0.7:
        score -= int((0.7 - alt_ratio) * 40)
    # Broken links penalty
    score -= min(30, broken_internal * 3)
    # TTFB penalty if > 0.8s
    if ttfb > 0.8:
        score -= int(min(30, (ttfb - 0.8) * 40))
    return max(0, min(100, score))

def estimate_organic_traffic(word_count: int, backlinks: int, seo_score: int) -> int:
    base = (word_count // 200) + (backlinks // 10) + (seo_score // 5)
    return int(base * 1.7)

def simple_keyword_rankings(keywords: list[str]) -> list[dict]:
    # Give fake ranks based on frequency order
    out = []
    for i, kw in enumerate(keywords[:50], 1):
        out.append({"keyword": kw, "current_rank": 100 - i, "change": (i % 5) - 2, "trend": "up" if i % 3 else "down"})
    return out
