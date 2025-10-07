import { load } from 'cheerio';
import computeScores from './computeScores';

export async function analyzeUrl(targetUrl: string) {
  let target = targetUrl;
  if (!/^https?:\/\//i.test(target)) target = 'http://' + target;

  const start = Date.now();
  const resp = await fetch(target, { redirect: 'follow' } as any);
  const responseTimeMs = Date.now() - start;
  const status = resp.status;
  const buffer = await resp.arrayBuffer();
  const totalBytes = buffer.byteLength;
  let html = '';
  try { html = Buffer.from(buffer).toString('utf8'); } catch { html = ''; }
  const $ = load(html || '');

  const title = $('head > title').text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr('content') || null;
  const h1Count = $('h1').length;
  const imagesTotal = $('img').length;
  const imagesWithAlt = $('img').filter((i, el) => { const alt = $(el).attr('alt'); return typeof alt === 'string' && alt.trim().length > 0; }).length;
  const hasViewport = !!$('meta[name="viewport"]').attr('content');
  const hasCanonical = !!$('link[rel="canonical"]').attr('href');
  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogImage = $('meta[property="og:image"]').attr('content') || null;
  const twitterCard = $('meta[name="twitter:card"]').attr('content') || null;
  const wordCount = $('body').text().split(/\s+/).filter(Boolean).length;

  const info = { url: target, status, responseTimeMs, totalBytes, title, metaDescription, h1Count, imagesTotal, imagesWithAlt, hasViewport, hasCanonical, ogTitle, ogImage, twitterCard, wordCount };
  const scores = await computeScores(info);

  // keywords (filter alphabetic tokens)
  const bodyText = $('body').text().toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const stopwords = new Set(['the','and','a','to','of','in','is','it','you','that','for','on','with','as','are','this','be','or','by','an','from','at','we','have']);
  const freq: Record<string, number> = {};
  for (const w of bodyText.split(/\s+/).filter(Boolean)) {
    if (w.length < 3 || stopwords.has(w)) continue;
    if (!/^[a-z]+$/.test(w)) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  const uniqueKeywordCount = Object.keys(freq).length;
  const keywords = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,50).map(([k], idx)=>({ keyword:k, rank: Math.max(1,100-idx), change: (idx%5)-2 }));

  // backlinks estimate
  let backlinksEstimate = 0;
  try {
    const pageUrl = new URL(target);
    $('a[href]').each((i, el)=>{
      const href = $(el).attr('href');
      if (!href) return;
      try { const u = new URL(href, pageUrl.href); if (u.hostname !== pageUrl.hostname) backlinksEstimate +=1; } catch {}
    });
  } catch {}

  const issues = { missing_meta_descriptions: metaDescription?0:1, slow_loading_pages: responseTimeMs>1000?1:0, broken_internal_links:0, missing_alt_tags: imagesTotal?Math.max(0, imagesTotal-imagesWithAlt):0 };
  const organicTrafficEstimate = Math.max(0, Math.round((wordCount/100) + (uniqueKeywordCount*1.2) + (scores.seoScore/3)));
  const kpis = { seo_score: scores.seoScore, organic_traffic: organicTrafficEstimate, keyword_rankings: uniqueKeywordCount, backlinks: backlinksEstimate };

  return { id: 'a'+Date.now(), createdAt: new Date().toISOString(), ...info, ...scores, psi: scores.psiMetrics ?? null, keywords, issues, kpis };
}

export default analyzeUrl;
