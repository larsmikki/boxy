import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Gamepad2, Plus } from 'lucide-react'
import BulkOperations from '@/components/BulkOperations'
import GameCard from '@/components/GameCard'
import GameForm from '@/components/GameForm'
import SearchFilters, { type FilterState } from '@/components/SearchFilters'
import { useCardSize } from '@/hooks/useCardSize'
import { bulkDeleteGames, bulkUpdateGames, deleteGame, getGames, saveGame, toggleWishlist } from '@/lib/db'
import type { Game } from '@/types'
import { Button, Modal, Pill, Surface, useToast } from '@/components/ui'

type Tab = 'collection' | 'wishlist'

export default function FrontPage() {
  const { addToast } = useToast()
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

  const loadGames = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const data = await getGames()
      setGames(Array.isArray(data) ? data : [])
    } catch {
      addToast('Failed to load your game collection.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadGames(false) }, [loadGames])

  const filteredAndSortedGames = useMemo(() => {
    const filtered = games.filter(game => {
      if (activeTab === 'collection' && game.is_wishlist) return false
      if (activeTab === 'wishlist' && !game.is_wishlist) return false
      if (filters.search && !game.title.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.condition && game.condition !== filters.condition) return false
      return true
    })

    filtered.sort((a, b) => {
      let av = a[filters.sortBy as keyof Game]
      let bv = b[filters.sortBy as keyof Game]
      if (typeof av === 'string') {
        av = av.toLowerCase()
        bv = (bv as string)?.toLowerCase() ?? ''
      }
      const aValue = av ?? ''
      const bValue = bv ?? ''
      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [games, filters, activeTab])

  const handleSaveGame = async (gameData: Omit<Game, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await saveGame(gameData, editingGame?.id)
      addToast(`${editingGame ? 'Game updated' : 'Game added'} - ${gameData.title} saved.`, 'success')
      await loadGames()
      setSearchParams({})
      setEditingGame(undefined)
    } catch {
      addToast('Failed to save game. Please try again.', 'error')
    }
  }

  const handleDeleteGame = async (id: string) => {
    try {
      const game = games.find(g => g.id === id)
      await deleteGame(id)
      addToast(`Game deleted - ${game?.title} removed.`, 'success')
      await loadGames()
    } catch {
      addToast('Failed to delete.', 'error')
    }
  }

  const handleToggleWishlist = async (id: string) => {
    try {
      const game = games.find(g => g.id === id)
      if (!game) return
      await toggleWishlist(id)
      addToast(`Moved - ${game.title}`, 'success')
      await loadGames()
    } catch {
      addToast('Failed to update.', 'error')
    }
  }

  const cardGridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${
      cardSize === 'small' ? '140px' : cardSize === 'large' ? '260px' : '200px'
    }, 1fr))`,
    gap: '1rem',
  }

  const { collectionCount, wishlistCount } = useMemo(() => ({
    collectionCount: games.filter(g => !g.is_wishlist).length,
    wishlistCount: games.filter(g => g.is_wishlist).length,
  }), [games])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text">Your library</h1>
          {!loading && (
            <p className="text-sm mt-0.5 text-text2">
              {collectionCount} {collectionCount === 1 ? 'game' : 'games'} in your library
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="mt-2.5 shrink-0"
          leadingIcon={<Plus className="h-4 w-4" />}
          onClick={() => setSearchParams({ form: '1' })}
        >
          {activeTab === 'wishlist' ? 'Add to Wishlist' : 'Add Game'}
        </Button>
      </div>

      <SearchFilters filters={filters} onFiltersChange={setFilters} />

      <div className="flex items-center gap-2 flex-wrap">
        {(['collection', 'wishlist'] as const).map(tab => (
          <Pill
            key={tab}
            active={activeTab === tab}
            onClick={() => { setFilters(f => ({ ...f, condition: '' })); setActiveTab(tab) }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Pill>
        ))}
      </div>

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
              <div key={i} className="h-48 rounded-xl animate-pulse bg-surface2" />
            ))}
          </div>
        ) : filteredAndSortedGames.length === 0 ? (
          <Surface className="py-16 px-6 text-center">
            <Gamepad2 className="h-12 w-12 mx-auto mb-3 text-text2" aria-hidden="true" />
            <p className="font-semibold mb-1 text-text">
              {activeTab === 'wishlist' ? 'No wishlist items found' : 'No games found'}
            </p>
            <p className="text-sm mb-4 text-text2">
              {activeTab === 'wishlist'
                ? (wishlistCount === 0 ? 'Start adding games to your wishlist.' : 'Try adjusting your filters.')
                : (collectionCount === 0 ? 'Add your first game to get started.' : 'Try adjusting your filters.')}
            </p>
            <Button type="button" variant="primary" size="lg" onClick={() => setSearchParams({ form: '1' })}>
              {activeTab === 'wishlist' ? 'Add to Wishlist' : 'Add Your First Game'}
            </Button>
          </Surface>
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
                  const nextSelected = new Set(selectedGames)
                  if (selected) nextSelected.add(id)
                  else nextSelected.delete(id)
                  setSelectedGames(nextSelected)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal
          title={editingGame ? 'Edit game' : `Add ${activeTab === 'wishlist' ? 'wishlist ' : ''}game`}
          maxWidth={640}
          onClose={() => { setSearchParams({}); setEditingGame(undefined) }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 65px)' }}>
            <GameForm
              game={editingGame}
              onSave={handleSaveGame}
              onCancel={() => { setSearchParams({}); setEditingGame(undefined) }}
              isWishlist={activeTab === 'wishlist'}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
