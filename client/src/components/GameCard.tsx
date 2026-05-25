import { useState } from 'react'
import { ArrowLeftRight, Edit2, Gamepad2, Trash2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import ConfirmModal from './ConfirmModal'
import type { Game } from '@/types'

interface GameCardProps {
  game: Game
  onEdit: (game: Game) => void
  onDelete: (id: string) => void
  onToggleWishlist: (id: string) => void
  isSelected?: boolean
  onSelectionChange?: (id: string, selected: boolean) => void
}

export default function GameCard({
  game, onEdit, onDelete, onToggleWishlist, isSelected, onSelectionChange,
}: GameCardProps) {
  const { theme } = useTheme()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <div
        className="card-hover group relative overflow-hidden rounded-xl"
        style={{
          background: theme.surface,
          border: isSelected ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
          boxShadow: 'var(--shadow-card-soft)',
        }}
      >
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-xl" style={{ background: theme.surface2 }}>
          {game.image_url ? (
            <img
              src={game.image_url}
              alt={game.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center flex-col gap-1 text-text2">
              <Gamepad2 className="h-10 w-10" aria-hidden="true" />
              <p className="text-xs">No image</p>
            </div>
          )}

          {onSelectionChange && (
            <button
              type="button"
              aria-label={isSelected ? 'Deselect game' : 'Select game'}
              className="absolute top-2 left-2 z-10 w-[18px] h-[18px] rounded flex items-center justify-center"
              onClick={() => onSelectionChange(game.id, !isSelected)}
              style={{
                border: `2px solid ${isSelected ? theme.accent : 'rgba(255,255,255,0.9)'}`,
                background: isSelected ? theme.accent : 'rgba(255,255,255,0.9)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {isSelected && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2">
            <button
              type="button"
              aria-label="Edit game"
              onClick={() => onEdit(game)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 text-white hover:opacity-80"
              style={{ border: '1px solid rgba(255,255,255,0.5)' }}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={game.is_wishlist ? 'Move to collection' : 'Move to wishlist'}
              onClick={() => onToggleWishlist(game.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 text-white hover:opacity-80"
              style={{ border: '1px solid rgba(255,255,255,0.5)' }}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Delete game"
              onClick={() => setConfirmOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-danger text-white hover:opacity-80"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-text">
            {game.title}
          </h3>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete game"
        description={`Are you sure you want to delete "${game.title}"? This cannot be undone.`}
        onConfirm={() => { setConfirmOpen(false); onDelete(game.id) }}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel="Delete"
      />
    </>
  )
}
