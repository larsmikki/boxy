import { useState } from 'react'
import { ArrowLeftRight, Edit2, Trash2, X } from 'lucide-react'
import { Button, Select, Surface, useToast } from '@/components/ui'
import { useTheme } from '@/contexts/ThemeContext'
import ConfirmModal from './ConfirmModal'
import { CONDITIONS } from '@/types'
import type { Game } from '@/types'

interface BulkOperationsProps {
  selectedGames: Set<string>
  games: Game[]
  onDeleteGames: (gameIds: string[]) => void
  onToggleWishlistGames: (gameIds: string[], toWishlist: boolean) => void
  onBulkEdit: (gameIds: string[], updates: Partial<Game>) => void
  onSelectAll: () => void
  onClearSelection: () => void
}

export default function BulkOperations({
  selectedGames, games, onDeleteGames, onToggleWishlistGames,
  onBulkEdit, onSelectAll, onClearSelection,
}: BulkOperationsProps) {
  const { addToast } = useToast()
  const { theme } = useTheme()
  const [bulkCondition, setBulkCondition] = useState('')
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selectedCount = selectedGames.size
  const visibleSelectedCount = games.filter(g => selectedGames.has(g.id)).length
  const allSelected = visibleSelectedCount === games.length && games.length > 0
  const someSelected = visibleSelectedCount > 0 && visibleSelectedCount < games.length

  if (selectedCount === 0) return null

  const handleBulkConditionUpdate = () => {
    if (!bulkCondition) {
      addToast('Please select a condition to update.', 'error')
      return
    }
    onBulkEdit(Array.from(selectedGames), { condition: bulkCondition })
    setBulkCondition('')
    setShowBulkEdit(false)
    onClearSelection()
    addToast(`Updated condition for ${selectedCount} games.`, 'success')
  }

  const handleBulkDelete = () => {
    onDeleteGames(Array.from(selectedGames))
    onClearSelection()
    addToast(`Deleted ${selectedCount} games.`, 'success')
  }

  const handleBulkWishlistToggle = () => {
    const selectedGamesList = games.filter(g => selectedGames.has(g.id))
    const toWishlist = selectedGamesList.some(g => !g.is_wishlist)
    onToggleWishlistGames(Array.from(selectedGames), toWishlist)
    onClearSelection()
    addToast(`Moved ${selectedCount} games to ${toWishlist ? 'wishlist' : 'collection'}.`, 'success')
  }

  return (
    <>
      <Surface className="p-4 mb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={allSelected || someSelected ? 'Clear selected games' : 'Select all visible games'}
              onClick={() => allSelected || someSelected ? onClearSelection() : onSelectAll()}
              className="w-[18px] h-[18px] rounded flex items-center justify-center"
              style={{
                border: `2px solid ${allSelected || someSelected ? theme.accent : theme.border}`,
                background: allSelected ? theme.accent : 'transparent',
              }}
            >
              {allSelected && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {someSelected && !allSelected && (
                <div style={{ width: 8, height: 2, background: theme.accent, borderRadius: 1 }} />
              )}
            </button>
            <span className="text-sm font-medium text-text">
              {selectedCount === games.length ? 'All' : selectedCount} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={() => setShowBulkEdit(!showBulkEdit)} leadingIcon={<Edit2 className="w-3.5 h-3.5" />}>
              Edit
            </Button>
            <Button type="button" size="sm" onClick={handleBulkWishlistToggle} leadingIcon={<ArrowLeftRight className="w-3.5 h-3.5" />}>
              Move
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={() => setConfirmOpen(true)} leadingIcon={<Trash2 className="w-3.5 h-3.5" />}>
              Delete
            </Button>
            <Button type="button" size="sm" onClick={onClearSelection} leadingIcon={<X className="w-3.5 h-3.5" />}>
              Clear
            </Button>
          </div>
        </div>

        {showBulkEdit && (
          <div
            className="mt-3 flex flex-col sm:flex-row items-start sm:items-end gap-3 pt-3"
            style={{ borderTop: `1px solid ${theme.border}` }}
          >
            <div className="flex-1 space-y-1">
              <label className="text-xs uppercase tracking-wider font-semibold text-text2">
                Update condition for {selectedCount} games
              </label>
              <Select
                value={bulkCondition}
                onChange={e => setBulkCondition(e.target.value)}
                className="max-w-48"
              >
                <option value="">Select condition</option>
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="primary" disabled={!bulkCondition} onClick={handleBulkConditionUpdate}>
                Update
              </Button>
              <Button type="button" onClick={() => setShowBulkEdit(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Surface>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete selected games"
        description={`Are you sure you want to delete ${selectedCount} selected games? This cannot be undone.`}
        onConfirm={() => { setConfirmOpen(false); handleBulkDelete() }}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel={`Delete ${selectedCount} games`}
      />
    </>
  )
}
