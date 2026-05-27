import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
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

export async function writeGames(games: Game[]) {
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.writeFile(gamesFile(), JSON.stringify(games, null, 2));
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
