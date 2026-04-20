const functions = require('firebase-functions/v1');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
  parseTagValue: true,
  processEntities: true,
});

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function readText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (typeof value['#text'] === 'string') return value['#text'].trim();
    if (typeof value.__cdata === 'string') return value.__cdata.trim();
  }
  return '';
}

function getAtomLink(entry) {
  const links = asArray(entry.link);
  for (const link of links) {
    if (typeof link === 'string' && link.trim()) return link.trim();
    if (!link || typeof link !== 'object') continue;
    if (link.rel && link.rel !== 'alternate') continue;
    if (typeof link.href === 'string' && link.href.trim()) return link.href.trim();
  }
  return '';
}

function getRssLink(item) {
  const direct = readText(item.link);
  if (direct) return direct;
  const guid = readText(item.guid);
  if (guid.startsWith('http://') || guid.startsWith('https://')) return guid;
  return '';
}

function normalizeRss(root) {
  const channel = Array.isArray(root?.rss?.channel) ? root.rss.channel[0] : root?.rss?.channel;
  if (!channel) throw new Error('RSS feed is missing a channel.');

  return {
    title: readText(channel.title) || 'Untitled',
    items: asArray(channel.item).map((item) => ({
      title: readText(item.title) || '(no title)',
      link: getRssLink(item),
      date: readText(item.pubDate) || readText(item['dc:date']) || '',
    })),
  };
}

function normalizeAtom(root) {
  const feed = root?.feed;
  if (!feed) throw new Error('Atom feed is missing a feed node.');

  return {
    title: readText(feed.title) || 'Untitled',
    items: asArray(feed.entry).map((entry) => ({
      title: readText(entry.title) || '(no title)',
      link: getAtomLink(entry),
      date: readText(entry.updated) || readText(entry.published) || '',
    })),
  };
}

function parseFeed(xml) {
  const parsed = parser.parse(xml);
  if (parsed?.rss?.channel) return normalizeRss(parsed);
  if (parsed?.feed) return normalizeAtom(parsed);
  throw new Error('Not a valid RSS or Atom feed.');
}

function isBlockedHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (!host) return true;
  if (['localhost', '0.0.0.0', '127.0.0.1', 'metadata.google.internal'].includes(host)) return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

function validateFeedUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Feed URL is invalid.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS feed URLs are allowed.');
  }

  if (isBlockedHost(parsed.hostname)) {
    throw new Error('That host is not allowed.');
  }

  return parsed.toString();
}

async function fetchFeedFromSource(url) {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TheNewspaperGuyFeedProxy/1.0',
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Source returned HTTP ${response.status}`);
  }

  const xml = await response.text();
  if (!xml || xml.length < 50) {
    throw new Error('Source returned an empty feed.');
  }

  const payload = parseFeed(xml);
  payload.items = asArray(payload.items)
    .filter((item) => item && item.title)
    .slice(0, 8);

  cache.set(url, {
    payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return payload;
}

exports.feedProxy = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=120, s-maxage=300');

    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    try {
      const sourceUrl = validateFeedUrl(req.query.url);
      const payload = await fetchFeedFromSource(sourceUrl);
      res.status(200).json(payload);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Feed proxy failed.' });
    }
  });