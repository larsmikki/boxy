import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import dns from 'node:dns/promises';
import { config } from '../config.js';

export interface Game {
  id: string;
  title: string;
  condition: string;
  image_url?: string;
  notes?: string;
  is_wishlist: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface ImportedGame extends Partial<Game> {
  image_data?: string;
  edition?: unknown;
  current_price?: unknown;
}

const gamesFile = () => path.join(config.dataDir, 'games.json');
const imagesDir = () => path.join(config.dataDir, 'images');

export async function readGames(): Promise<Game[]> {
  try {
    const data = JSON.parse(await fs.readFile(gamesFile(), 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeGames(games: Game[]) {
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.writeFile(gamesFile(), JSON.stringify(games, null, 2));
}

export async function saveGame(body: Partial<Game>) {
  const games = await readGames();
  const now = new Date().toISOString();
  const existing = body.id ? games.find((game) => game.id === body.id) : null;

  if (existing) {
    Object.assign(existing, body, { updated_at: now });
  } else {
    games.unshift({
      ...body,
      id: body.id ?? randomUUID(),
      title: body.title ?? '',
      condition: body.condition ?? 'Good',
      is_wishlist: body.is_wishlist ?? false,
      created_at: now,
      updated_at: now,
    });
  }

  await writeGames(games);
}

export async function deleteGame(id: string) {
  const games = await readGames();
  await writeGames(games.filter((game) => game.id !== id));
}

export async function deleteGames(ids: string[]) {
  const idSet = new Set(ids);
  const games = await readGames();
  await writeGames(games.filter((game) => !idSet.has(game.id)));
}

export async function toggleWishlist(id: string) {
  const games = await readGames();
  const game = games.find((candidate) => candidate.id === id);
  if (!game) return;

  game.is_wishlist = !game.is_wishlist;
  game.updated_at = new Date().toISOString();
  await writeGames(games);
}

export async function bulkUpdate(ids: string[], updates: Partial<Game>) {
  const games = await readGames();
  const now = new Date().toISOString();
  for (const game of games) {
    if (ids.includes(game.id)) Object.assign(game, updates, { updated_at: now });
  }
  await writeGames(games);
}

export async function deleteAllGames() {
  await writeGames([]);
}

export async function saveImage(buffer: Buffer, contentType: string) {
  const ext = (contentType.split('/')[1] ?? 'jpg').split(';')[0];
  const filename = `${randomUUID()}.${ext}`;
  await fs.mkdir(imagesDir(), { recursive: true });
  await fs.writeFile(path.join(imagesDir(), filename), buffer);
  return `/api/images/${filename}`;
}

export async function getImage(filename: string) {
  return fs.readFile(path.join(imagesDir(), path.basename(filename)));
}

export async function importGames(incoming: ImportedGame[]) {
  const existing = await readGames();
  const existingIds = new Set(existing.map((game) => game.id));
  const added: Game[] = [];

  for (const game of incoming) {
    if (!game.id || existingIds.has(game.id)) continue;
    const { image_data, edition: _edition, current_price: _currentPrice, ...rest } = game;

    if (image_data) {
      try {
        const match = image_data.match(/^data:([^;]+);base64,(.+)$/s);
        if (match) {
          rest.image_url = await saveImage(Buffer.from(match[2], 'base64'), match[1]);
        }
      } catch {
        // Keep the original image_url if embedded image extraction fails.
      }
    }

    added.push(rest as Game);
  }

  if (added.length) await writeGames([...added, ...existing]);
  return added.length;
}

const privateRanges = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^0\.0\.0\.0$/,
];

export async function assertPublicUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed');
  }

  const { address } = await dns.lookup(parsed.hostname);
  if (privateRanges.some((range) => range.test(address))) {
    throw new Error('URL resolves to a private address');
  }
}
