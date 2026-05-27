import type { Game } from '@/types'

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res
}

export async function getGames(): Promise<Game[]> {
  return api('/api/games').then(r => r.json())
}

export async function saveGame(
  data: Omit<Game, 'id' | 'created_at' | 'updated_at'>,
  existingId?: string
): Promise<void> {
  await api('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, id: existingId }),
  })
}

export async function deleteGame(id: string): Promise<void> {
  await api(`/api/games/${id}`, { method: 'DELETE' })
}

export async function toggleWishlist(id: string): Promise<void> {
  await api(`/api/games/${id}/wishlist`, { method: 'PATCH' })
}

export async function deleteAllGames(): Promise<void> {
  await api('/api/games', { method: 'DELETE' })
}

export async function bulkUpdateGames(ids: string[], updates: Partial<Game>): Promise<void> {
  await api('/api/games/bulk-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, updates }),
  })
}

export async function bulkDeleteGames(ids: string[]): Promise<void> {
  await api('/api/games/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
}
