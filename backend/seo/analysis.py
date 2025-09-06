import re, asyncio
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from collections import Counter

import httpx

from utils import fetch_html, is_internal, check_link_ok, score_seo, estimate_organic_traffic, simple_keyword_rankings

async def analyze_url(url: str):
    async with httpx.AsyncClient() as client:
        html, latency, status = await fetch_html(client, url)
        soup = BeautifulSoup(html, "html.parser")

        title = (soup.title.string or "").strip() if soup.title else ""
        meta_desc_tag = soup.find("meta", attrs={"name": "description"})
        meta_ok = bool(meta_desc_tag and meta_desc_tag.get("content", "").strip())

        images = soup.find_all("img")
        with_alt = sum(1 for img in images if img.get("alt"))
        alt_ratio = (with_alt / max(1, len(images)))

        # Collect links
        links = [a.get("href") for a in soup.find_all("a") if a.get("href")]
        full_links = [urljoin(url, l) for l in links]

        internal_links = [l for l in full_links if is_internal(url, l)]
        external_links = [l for l in full_links if not is_internal(url, l)]

        # Check broken internal links (limit to 30 checks for speed)
        to_check = internal_links[:30]
        results = await asyncio.gather(*[check_link_ok(client, l) for l in to_check])
        broken_internal = sum(1 for ok in results if not ok)

        # Keywords (super simple: take words in headings & strong tags)
        texts = []
        for tag in soup.find_all(["h1","h2","h3","strong","b"]):
            texts.append(tag.get_text(" ", strip=True))
        words = re.findall(r"[a-zA-Z]{4,}", " ".join(texts).lower())
        common = [w for w,_ in Counter(words).most_common(100)]

        backlinks = len(external_links)
        word_count = len(re.findall(r"[a-zA-Z]{2,}", soup.get_text(" ", strip=True)))
        seo_score = score_seo(meta_ok, alt_ratio, broken_internal, latency)
        organic = estimate_organic_traffic(word_count, backlinks, seo_score)

        issues = {
            "missing_meta_descriptions": 0 if meta_ok else 1,
            "slow_loading_pages": 1 if latency > 2.0 else 0,
            "broken_internal_links": broken_internal,
            "missing_alt_tags": max(0, len(images) - with_alt),
        }

        rankings = {
            "detailed": simple_keyword_rankings(common),
            "keywords_total": len(common)
        }

        kpis = {
            "seo_score": seo_score,
            "organic_traffic": organic,
            "keyword_rankings": len(rankings["detailed"]),
            "backlinks": backlinks
        }

        return {
            "url": url,
            "kpis": kpis,
            "issues": issues,
            "rankings": rankings,
            "latency": latency,
            "status_code": status,
        }
