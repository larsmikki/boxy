import { useState } from 'react'
import { globalBtnStyle } from '@/lib/styles'
import { Trash2, ArrowLeftRight, Edit2, X } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
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
  const { toast } = useToast()
  const { theme } = useTheme()
  const [bulkCondition, setBulkCondition] = useState('')
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selectedCount = selectedGames.size
  const visibleSelectedCount = games.filter(g => selectedGames.has(g.id)).length
  const allSelected = visibleSelectedCount === games.length && games.length > 0
  const someSelected = visibleSelectedCount > 0 && visibleSelectedCount < games.length

  if (selectedCount === 0) return null

  const btn = (primary = false, disabled = false) => ({
    ...globalBtnStyle,
    padding: '6px 12px',
    cursor: disabled ? 'not-allowed' as const : 'pointer' as const,
    opacity: disabled ? 0.5 : 1,
    border: primary ? 'none' : `1px solid ${theme.border}`,
    background: primary ? theme.accent : theme.surface2,
    color: primary ? '#fff' : theme.text,
  })

  const handleBulkConditionUpdate = () => {
    if (!bulkCondition) {
      toast({ title: 'Error', description: 'Please select a condition to update.', variant: 'destructive' })
      return
    }
    onBulkEdit(Array.from(selectedGames), { condition: bulkCondition })
    setBulkCondition('')
    setShowBulkEdit(false)
    onClearSelection()
    toast({ title: 'Success', description: `Updated condition for ${selectedCount} games.` })
  }

  const handleBulkDelete = () => {
    onDeleteGames(Array.from(selectedGames))
    onClearSelection()
    toast({ title: 'Success', description: `Deleted ${selectedCount} games.` })
  }

  const handleBulkWishlistToggle = () => {
    const selectedGamesList = games.filter(g => selectedGames.has(g.id))
    const toWishlist = selectedGamesList.some(g => !g.is_wishlist)
    onToggleWishlistGames(Array.from(selectedGames), toWishlist)
    onClearSelection()
    toast({ title: 'Success', description: `Moved ${selectedCount} games to ${toWishlist ? 'wishlist' : 'collection'}.` })
  }

  const inputStyle = {
    padding: '6px 10px', borderRadius: '6px',
    border: `1px solid ${theme.border}`, background: theme.surface,
    color: theme.text, fontSize: '0.875rem', outline: 'none', width: '160px',
  }

  return (
    <>
      <div
        style={{
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: '0.5rem', padding: '12px 16px', marginBottom: '8px',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Indeterminate-capable checkbox */}
            <div
              onClick={() => allSelected || someSelected ? onClearSelection() : onSelectAll()}
              style={{
                width: 18, height: 18, borderRadius: 4, cursor: 'pointer',
                border: `2px solid ${allSelected || someSelected ? theme.accent : theme.border}`,
                background: allSelected ? theme.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {allSelected && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {someSelected && !allSelected && (
                <div style={{ width: 8, height: 2, background: theme.accent, borderRadius: 1 }} />
              )}
            </div>
            <span className="text-sm font-medium" style={{ color: theme.text }}>
              {selectedCount === games.length ? 'All' : selectedCount} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button style={btn()} onClick={() => setShowBulkEdit(!showBulkEdit)}>
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button style={btn()} onClick={handleBulkWishlistToggle}>
              <ArrowLeftRight className="w-3.5 h-3.5" /> Move
            </button>
            <button
              style={{ ...btn(), background: '#ef4444', color: '#fff', border: 'none' }}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button style={btn()} onClick={onClearSelection}>
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>

        {showBulkEdit && (
          <div
            className="mt-3 flex flex-col sm:flex-row items-start sm:items-end gap-3"
            style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '12px' }}
          >
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium" style={{ color: theme.text }}>
                Update Condition for {selectedCount} games
              </label>
              <select
                value={bulkCondition}
                onChange={e => setBulkCondition(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select condition</option>
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button style={btn(true, !bulkCondition)} onClick={handleBulkConditionUpdate} disabled={!bulkCondition}>
                Update
              </button>
              <button style={btn()} onClick={() => setShowBulkEdit(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete selected games"
        description={`Are you sure you want to delete ${selectedCount} selected games? This cannot be undone.`}
        onConfirm={() => { setConfirmOpen(false); handleBulkDelete() }}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel={`Delete ${selectedCount} Games`}
      />
    </>
  )
}
