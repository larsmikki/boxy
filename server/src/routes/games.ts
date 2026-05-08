import express from 'express';
import {
  assertPublicUrl,
  bulkUpdate,
  deleteAllGames,
  deleteGame,
  deleteGames,
  getImage,
  importGames,
  readGames,
  saveGame,
  saveImage,
  toggleWishlist,
} from '../services/games.js';

const router = express.Router();

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function problemDetail(status: number, title: string, detail: string) {
  return { type: 'about:blank', title, status, detail };
}

async function searchImages(query: string, offset = 0) {
  const encodedQuery = encodeURIComponent(query);
  const initHtml = await fetch(`https://duckduckgo.com/?q=${encodedQuery}&iax=images&ia=images`, {
    headers: { 'User-Agent': userAgent },
  }).then((response) => response.text());

  const vqdMatch = initHtml.match(/vqd=['"]?([^'"&\s]+)/);
  if (!vqdMatch) throw new Error('Could not get DuckDuckGo session token');

  const data = await fetch(
    `https://duckduckgo.com/i.js?q=${encodedQuery}&vqd=${encodeURIComponent(vqdMatch[1])}&o=json&s=${offset}`,
    { headers: { 'User-Agent': userAgent, Referer: 'https://duckduckgo.com/' } },
  ).then((response) => response.json() as Promise<{ results?: Array<{ thumbnail: string; image: string; title?: string }> }>);

  return (data.results ?? []).slice(0, 9).map((result) => ({
    thumb: result.thumbnail,
    full: result.image,
    title: result.title ?? '',
  }));
}

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/games', async (_req, res, next) => {
  try {
    res.json(await readGames());
  } catch (error) {
    next(error);
  }
});

router.post('/games', async (req, res, next) => {
  try {
    await saveGame(req.body);
    res.json({});
  } catch (error) {
    next(error);
  }
});

router.delete('/games', async (_req, res, next) => {
  try {
    await deleteAllGames();
    res.json({});
  } catch (error) {
    next(error);
  }
});

router.delete('/games/:id', async (req, res, next) => {
  try {
    await deleteGame(req.params.id);
    res.json({});
  } catch (error) {
    next(error);
  }
});

router.patch('/games/:id/wishlist', async (req, res, next) => {
  try {
    await toggleWishlist(req.params.id);
    res.json({});
  } catch (error) {
    next(error);
  }
});

router.post('/games/bulk-update', async (req, res, next) => {
  try {
    await bulkUpdate(req.body.ids ?? [], req.body.updates ?? {});
    res.json({});
  } catch (error) {
    next(error);
  }
});

router.post('/games/bulk-delete', async (req, res, next) => {
  try {
    await deleteGames(req.body.ids ?? []);
    res.json({});
  } catch (error) {
    next(error);
  }
});

router.post('/games/import', async (req, res, next) => {
  try {
    const added = await importGames(req.body.games ?? []);
    res.json({ added });
  } catch (error) {
    next(error);
  }
});

router.post('/images', express.raw({ type: Array.from(allowedImageTypes), limit: '50mb' }), async (req, res, next) => {
  try {
    const contentType = (req.headers['content-type'] ?? '').split(';')[0].trim();
    if (!allowedImageTypes.has(contentType)) {
      res
        .status(415)
        .type('application/problem+json')
        .json(problemDetail(415, 'Unsupported Media Type', `Image type '${contentType}' is not allowed.`));
      return;
    }

    const imageUrl = await saveImage(req.body, contentType);
    res.json({ url: imageUrl });
  } catch (error) {
    next(error);
  }
});

router.get('/images/:filename', async (req, res, next) => {
  try {
    const data = await getImage(req.params.filename);
    res.type('image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(data);
  } catch (error) {
    next(error);
  }
});

router.get('/proxy-and-save', async (req, res, next) => {
  try {
    const imageUrl = String(req.query.url ?? '');
    await assertPublicUrl(imageUrl);

    const imageResponse = await fetch(imageUrl, { headers: { 'User-Agent': userAgent } });
    if (!imageResponse.ok) throw new Error(`Upstream ${imageResponse.status}`);

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = (imageResponse.headers.get('content-type') ?? 'image/jpeg').split(';')[0].trim();
    if (!allowedImageTypes.has(contentType)) throw new Error(`Upstream returned unsupported type: ${contentType}`);

    const savedUrl = await saveImage(buffer, contentType);
    res.json({ url: savedUrl });
  } catch (error) {
    next(error);
  }
});

router.get('/search-images', async (req, res, next) => {
  try {
    const query = String(req.query.q ?? '');
    if (!query) {
      res.status(400).type('application/problem+json').json(problemDetail(400, 'Bad Request', 'Query parameter "q" is required'));
      return;
    }

    const offset = parseInt(String(req.query.offset ?? '0'), 10);
    const images = await searchImages(query, offset);
    res.json({ images });
  } catch (error) {
    next(error);
  }
});

export default router;
