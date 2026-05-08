import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import GameCard from '@/components/GameCard'
import GameForm from '@/components/GameForm'
import SearchFilters, { type FilterState } from '@/components/SearchFilters'
import BulkOperations from '@/components/BulkOperations'
import { useToast } from '@/contexts/ToastContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useCardSize } from '@/hooks/useCardSize'
import { getGames, saveGame, deleteGame, toggleWishlist, bulkUpdateGames, bulkDeleteGames } from '@/lib/db'
import type { Game } from '@/types'

type Tab = 'collection' | 'wishlist'

export default function FrontPage() {
  const { toast } = useToast()
  const { theme } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()

  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('collection')
  const showForm = searchParams.has('form')
  const [editingGame, setEditingGame] = useState<Game | undefined>()
  const [filters, setFilters] = useState<FilterState>({
    search: '', condition: '', sortBy: 'title', sortOrder: 'asc',
  })
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())
  const { cardSize } = useCardSize()

  useEffect(() => { loadGames() }, [])

  const loadGames = async () => {
    setLoading(true)
    try {
      const data = await getGames()
      setGames(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: 'Error loading games', description: 'Failed to load your game collection.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedGames = useMemo(() => {
    let filtered = games.filter(game => {
      if (activeTab === 'collection' && game.is_wishlist) return false
      if (activeTab === 'wishlist' && !game.is_wishlist) return false
      if (filters.search && !game.title.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.condition && game.condition !== filters.condition) return false
      return true
    })

    filtered.sort((a, b) => {
      let av: any = a[filters.sortBy as keyof Game]
      let bv: any = b[filters.sortBy as keyof Game]
      if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv as string)?.toLowerCase() ?? '' }
      if (av < bv) return filters.sortOrder === 'asc' ? -1 : 1
      if (av > bv) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [games, filters, activeTab])

  const handleSaveGame = async (gameData: Omit<Game, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await saveGame(gameData, editingGame?.id)
      toast({ title: editingGame ? 'Game updated' : 'Game added', description: `${gameData.title} saved.` })
      await loadGames()
      setSearchParams({})
      setEditingGame(undefined)
    } catch {
      toast({ title: 'Error saving game', description: 'Failed to save. Please try again.', variant: 'destructive' })
    }
  }

  const handleDeleteGame = async (id: string) => {
    try {
      const game = games.find(g => g.id === id)
      await deleteGame(id)
      toast({ title: 'Game deleted', description: `${game?.title} removed.` })
      await loadGames()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' })
    }
  }

  const handleToggleWishlist = async (id: string) => {
    try {
      const game = games.find(g => g.id === id)
      if (!game) return
      await toggleWishlist(id)
      toast({ title: 'Moved', description: game.title })
      await loadGames()
    } catch {
      toast({ title: 'Error', description: 'Failed to update.', variant: 'destructive' })
    }
  }

  const cardGridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${
      cardSize === 'small' ? '140px' : cardSize === 'large' ? '260px' : '200px'
    }, 1fr))`,
    gap: '1rem',
  }

  const panelStyle = {
    background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '0.5rem',
  }

  const accentBtnStyle = {
    padding: '10px 20px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600,
    background: theme.gradient, color: '#fff', border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    boxShadow: `0 4px 14px ${theme.accent}40`,
  }

  const { collectionCount, wishlistCount } = useMemo(() => ({
    collectionCount: games.filter(g => !g.is_wishlist).length,
    wishlistCount: games.filter(g => g.is_wishlist).length,
  }), [games])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.text }}>Your library</h1>
          {!loading && (
            <p className="text-sm mt-0.5" style={{ color: theme.text2 }}>
              {collectionCount} {collectionCount === 1 ? 'game' : 'games'} in your library
            </p>
          )}
        </div>
        <button style={{ ...accentBtnStyle, marginTop: '10px' }} onClick={() => setSearchParams({ form: '1' })}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {activeTab === 'wishlist' ? 'Add to Wishlist' : 'Add Game'}
        </button>
      </div>

      {/* Search bar */}
      <SearchFilters filters={filters} onFiltersChange={setFilters} />

      {/* Category pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['collection', 'wishlist'] as const).map(tab => (
          <button
            key={tab}
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              border: activeTab === tab ? 'none' : `1px solid ${theme.border}`,
              background: activeTab === tab ? theme.accent : theme.surface,
              color: activeTab === tab ? '#fff' : theme.text2,
              boxShadow: activeTab === tab ? `0 2px 8px ${theme.accent}50` : 'none',
            }}
            onClick={() => { setFilters(f => ({ ...f, condition: '' })); setActiveTab(tab) }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Games grid */}
      <div className="space-y-4">
        <BulkOperations
          selectedGames={selectedGames}
          games={filteredAndSortedGames}
          onDeleteGames={async ids => { await bulkDeleteGames(ids); await loadGames() }}
          onToggleWishlistGames={async (ids, toWishlist) => {
            await bulkUpdateGames(ids, { is_wishlist: toWishlist })
            await loadGames()
          }}
          onBulkEdit={async (ids, updates) => { await bulkUpdateGames(ids, updates); await loadGames() }}
          onSelectAll={() => setSelectedGames(new Set(filteredAndSortedGames.map(g => g.id)))}
          onClearSelection={() => setSelectedGames(new Set())}
        />

        {loading ? (
          <div style={cardGridStyle}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 rounded-lg animate-pulse" style={{ background: theme.surface2 }} />
            ))}
          </div>
        ) : filteredAndSortedGames.length === 0 ? (
          <div className="py-16 text-center rounded-lg" style={panelStyle}>
            <div className="text-5xl mb-3">{activeTab === 'wishlist' ? '📥' : '🎮'}</div>
            <p className="font-semibold mb-1" style={{ color: theme.text }}>
              {activeTab === 'wishlist' ? 'No wishlist items found' : 'No games found'}
            </p>
            <p className="text-sm mb-4" style={{ color: theme.text2 }}>
              {activeTab === 'wishlist'
                ? (wishlistCount === 0 ? 'Start adding games to your wishlist.' : 'Try adjusting your filters.')
                : (collectionCount === 0 ? 'Add your first game to get started.' : 'Try adjusting your filters.')}
            </p>
            <button style={accentBtnStyle} onClick={() => setSearchParams({ form: '1' })}>
              {activeTab === 'wishlist' ? 'Add to Wishlist' : 'Add Your First Game'}
            </button>
          </div>
        ) : (
          <div style={cardGridStyle}>
            {filteredAndSortedGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onEdit={g => { setEditingGame(g); setSearchParams({ form: '1' }) }}
                onDelete={handleDeleteGame}
                onToggleWishlist={handleToggleWishlist}
                isSelected={selectedGames.has(game.id)}
                onSelectionChange={(id, selected) => {
                  const s = new Set(selectedGames)
                  if (selected) s.add(id); else s.delete(id)
                  setSelectedGames(s)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)' }}
          onClick={() => { setSearchParams({}); setEditingGame(undefined) }}
        >
          <div
            className="w-full max-w-xl overflow-y-auto"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <GameForm
              game={editingGame}
              onSave={handleSaveGame}
              onCancel={() => { setSearchParams({}); setEditingGame(undefined) }}
              isWishlist={activeTab === 'wishlist'}
            />
          </div>
        </div>
      )}
    </div>
  )
}
