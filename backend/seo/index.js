// index.js (modified) - adds POST /api/analyze to return simple analysis
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { URL } = require('url');

// Load .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Backend 👋' });
});

// Example using API key from .env
app.get('/api/secure', (req, res) => {
  const apiKey = process.env.MY_API_KEY;
  res.json({ key: apiKey, note: 'This key is loaded from .env file' });
});

// Utility to extract title and meta description without external deps
function extractMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : null;

  const h1Matches = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gims)];
  const h1Count = h1Matches.length;

  const imgMatches = [...html.matchAll(/<img\b[^>]*>/gims)];
  const imagesTotal = imgMatches.length;
  const imagesWithAlt = imgMatches.filter(m => /alt\s*=\s*["'][^"']+["']/i.test(m[0])).length;

  const wordCount = (html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean)).length;

  const hasViewport = /<meta\s+name=["']viewport["']/.test(html);
  const hasCanonical = /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/.test(html);

  // OpenGraph and twitter checks (simple)
  const ogTitle = /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/.test(html);
  const ogImage = /<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/.test(html);
  const twitterCard = /<meta\s+name=["']twitter:card["']\s+content=["']([^"']*)["']/.test(html);

  return { title, metaDescription, h1Count, imagesTotal, imagesWithAlt, wordCount, hasViewport, hasCanonical, ogTitle, ogImage, twitterCard };
}

// POST /api/analyze - expects JSON body { url: "https://example.com" }
app.post('/api/analyze', async (req, res) => {
  try {
    let { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'Invalid request: url is required' });
    }

    // Normalize URL
    try {
      const parsed = new URL(url);
      url = parsed.href;
    } catch (e) {
      // try adding http://
      url = 'http://' + url;
    }

    const start = Date.now();
    // Use global fetch (Node 18+) if available; otherwise user should install node-fetch
    if (typeof fetch !== 'function') {
      return res.status(500).json({ message: 'Server fetch not available. Please run on Node 18+ or install node-fetch and restart.' });
    }

    const resp = await fetch(url, { redirect: 'follow' });
    const responseTimeMs = Date.now() - start;

    const status = resp.status;
    const contentType = resp.headers.get('content-type') || '';

    let text = '';
    try {
      text = await resp.text();
    } catch (e) {
      text = '';
    }

    const info = extractMeta(text || '');
    const analysis = {
      id: 'a' + Date.now(),
      url,
      status,
      responseTimeMs,
      contentType,
      ...info,
    };

    res.json({ analysis });
  } catch (err) {
    console.error('Analyze error:', err && err.message);
    res.status(500).json({ message: 'Failed to fetch or analyze the URL', detail: err?.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log('POST /api/analyze to analyze pages (JSON body: { "url": "https://example.com" })');
});
