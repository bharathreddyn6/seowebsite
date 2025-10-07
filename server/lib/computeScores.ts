import fetch from 'node-fetch';

function scoreRange(val: number, max = 100) {
  return Math.max(0, Math.min(Math.round(val), max));
}

export async function computeScores(info: any) {
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

  // PageSpeed Insights if key present
  const PAGESPEED_KEY = process.env.PAGESPEED_KEY;
  let psiMetrics: any = null;
  if (PAGESPEED_KEY) {
    try {
      const encoded = encodeURIComponent(info.url);
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encoded}&key=${PAGESPEED_KEY}&strategy=mobile`;
      const resp = await fetch(psiUrl, { redirect: 'follow' });
      if (resp.ok) {
        const json: any = await resp.json();
        const audits = json.lighthouseResult?.audits;
        const metrics = audits?.['metrics']?.details?.items?.[0] || null;
        const lcp = metrics?.['largest-contentful-paint'] || metrics?.['largestContentfulPaint'] || null;
        const fcp = metrics?.['first-contentful-paint'] || metrics?.['firstContentfulPaint'] || null;
        const ttfb = audits?.['server-response-time']?.numericValue || null;
        const performanceScore = Math.round((json.lighthouseResult?.categories?.performance?.score || 0) * 100);

        if (typeof performanceScore === 'number' && performanceScore > 0) {
          perf = performanceScore;
        } else if (lcp) {
          const lcpMs = Number(lcp);
          if (!Number.isNaN(lcpMs)) {
            if (lcpMs < 2500) perf = Math.max(perf, 85);
            else if (lcpMs < 4000) perf = Math.max(perf, 70);
            else perf = Math.max(perf, 50);
          }
        }

        psiMetrics = { lcp: lcp ?? null, fcp: fcp ?? null, ttfb: ttfb ?? null, performanceScore };
      }
    } catch (e) {
      // ignore
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

export default computeScores;
