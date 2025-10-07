#!/usr/bin/env node
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';

// load .env if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/i);
    if (m) process.env[m[1]] = m[2];
  }
}

function scoreRange(val, max = 100) {
  return Math.max(0, Math.min(Math.round(val), max));
}

async function computeScores(info) {
  const checks = {
    hasTitle: info.title ? 1 : 0,
    titleLenGood: info.title && info.title.length >= 10 && info.title.length <= 60 ? 1 : 0,
    hasMetaDesc: info.metaDescription ? 1 : 0,
    metaDescLenGood: info.metaDescription && info.metaDescription.length >= 50 && info.metaDescription.length <= 160 ? 1 : 0,
    hasH1: info.h1Count > 0 ? 1 : 0,
    imagesWithAltRatio: info.imagesTotal ? (info.imagesWithAlt / info.imagesTotal) : 1,
    hasViewport: info.hasViewport ? 1 : 0,
    hasCanonical: info.hasCanonical ? 1 : 0,
    wordCountScore: Math.min(1, info.wordCount / 3000),
  };

  const seo = (
    checks.hasTitle * 10 +
    checks.titleLenGood * 10 +
    checks.hasMetaDesc * 10 +
    checks.metaDescLenGood * 10 +
    checks.hasH1 * 10 +
    checks.imagesWithAltRatio * 10 +
    checks.hasViewport * 10 +
    checks.hasCanonical * 10 +
    checks.wordCountScore * 20
  );

  let brand = (info.ogTitle || info.ogImage ? 70 : 50);
  const social = (info.twitterCard || info.ogTitle ? 70 : 50);

  let perf = 70;
  if (info.responseTimeMs) {
    if (info.responseTimeMs < 200) perf = 90;
    else if (info.responseTimeMs < 500) perf = 75;
    else if (info.responseTimeMs < 1000) perf = 60;
    else perf = 40;
  }
  if (info.totalBytes && info.totalBytes > 500000) perf -= 10;

  // PageSpeed Insights
  const PAGESPEED_KEY = process.env.PAGESPEED_KEY;
  let psiMetrics = null;
  if (PAGESPEED_KEY) {
    try {
      const encoded = encodeURIComponent(info.url);
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encoded}&key=${PAGESPEED_KEY}&strategy=mobile`;
      const resp = await fetch(psiUrl, { redirect: 'follow' });
      if (resp.ok) {
        const json = await resp.json();
        const audits = json.lighthouseResult?.audits;
        const metrics = audits?.['metrics']?.details?.items?.[0] || null;
        const lcp = metrics?.['largest-contentful-paint'] || metrics?.['largestContentfulPaint'] || null;
        const fcp = metrics?.['first-contentful-paint'] || metrics?.['firstContentfulPaint'] || null;
        const ttfb = audits?.['server-response-time']?.numericValue || null;
        const performanceScore = Math.round((json.lighthouseResult?.categories?.performance?.score || 0) * 100);
        if (typeof performanceScore === 'number' && performanceScore > 0) {
          perf = performanceScore;
        }
        psiMetrics = { lcp: lcp ?? null, fcp: fcp ?? null, ttfb: ttfb ?? null, performanceScore };
      } else {
        console.warn('PSI request failed', resp.status);
      }
    } catch (e) {
      console.warn('PSI error', e && e.message);
    }
  }

  const overall = Math.round((seo + brand + social + perf) / 4);
  return {
    overallScore: scoreRange(overall),
    seoScore: scoreRange(seo),
    brandScore: scoreRange(brand),
    socialScore: scoreRange(social),
    performanceScore: scoreRange(perf),
    psiMetrics,
  };
}

async function analyzeUrl(url) {
  let target = url;
  if (!/^https?:\/\//i.test(target)) target = 'http://' + target;
  const start = Date.now();
  const resp = await fetch(target, { redirect: 'follow' });
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

  // keywords
  const bodyText = $('body').text().toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const stopwords = new Set(['the','and','a','to','of','in','is','it','you','that','for','on','with','as','are','this','be','or','by','an','from','at','we','have']);
  const freq = {};
  for (const w of bodyText.split(/\s+/).filter(Boolean)) { if (w.length<3||stopwords.has(w)) continue; freq[w]=(freq[w]||0)+1; }
  const uniqueKeywordCount = Object.keys(freq).length;
  const keywords = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,50).map(([k,i], idx)=>({ keyword:k, rank: Math.max(1,100-idx), change: (idx%5)-2 }));

  // backlinks estimate
  let backlinksEstimate = 0;
  try {
    const pageUrl = new URL(target);
    $('a[href]').each((i, el)=>{
      const href = $(el).attr('href');
      try { const u = new URL(href, pageUrl.href); if (u.hostname !== pageUrl.hostname) backlinksEstimate +=1; } catch {}
    });
  } catch {}

  const issues = { missing_meta_descriptions: metaDescription?0:1, slow_loading_pages: responseTimeMs>1000?1:0, broken_internal_links:0, missing_alt_tags: imagesTotal?Math.max(0, imagesTotal-imagesWithAlt):0 };
  const organicTrafficEstimate = Math.max(0, Math.round((wordCount/100) + (uniqueKeywordCount*1.2) + (scores.seoScore/3)));
  const kpis = { seo_score: scores.seoScore, organic_traffic: organicTrafficEstimate, keyword_rankings: uniqueKeywordCount, backlinks: backlinksEstimate };

  return { info, scores, psi: scores.psiMetrics ?? null, keywords, issues, kpis };
}

// run
const url = process.argv[2] || 'https://example.com';
console.log('Analyzing', url);
analyzeUrl(url).then(res=>{ console.log(JSON.stringify(res, null, 2)); process.exit(0); }).catch(err=>{ console.error('Error', err); process.exit(2); });
