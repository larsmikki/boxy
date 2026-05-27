import { randomUUID } from 'node:crypto';
import { type Game, type ImportedGame, readGames, writeGames, saveImage } from '../db/games.js';

export type { Game, ImportedGame };

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
