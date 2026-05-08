import { useState } from 'react'
import { Edit2, Trash2, ArrowLeftRight } from 'lucide-react'
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
        className="group relative overflow-hidden rounded-lg transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: theme.surface,
          border: isSelected ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Image area */}
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg" style={{ background: theme.surface2 }}>
          {game.image_url ? (
            <img
              src={game.image_url}
              alt={game.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center flex-col gap-1" style={{ color: theme.text2 }}>
              <div className="text-5xl">🎮</div>
              <p className="text-xs">No Image</p>
            </div>
          )}

          {/* Selection checkbox */}
          {onSelectionChange && (
            <div className="absolute top-2 left-2 z-10">
              <div
                onClick={() => onSelectionChange(game.id, !isSelected)}
                style={{
                  width: 18, height: 18, borderRadius: 4, cursor: 'pointer',
                  border: `2px solid ${isSelected ? theme.accent : 'rgba(255,255,255,0.9)'}`,
                  background: isSelected ? theme.accent : 'rgba(255,255,255,0.9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                {isSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Hover actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            <button
              onClick={() => onEdit(game)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 6, border: 'none',
                background: '#6b7280', color: '#fff', cursor: 'pointer',
              }}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleWishlist(game.id)}
              title={game.is_wishlist ? 'Move to Collection' : 'Move to Wishlist'}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer',
              }}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 6, border: 'none',
                background: '#ef4444', color: '#fff', cursor: 'pointer',
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight" style={{ color: theme.text }}>
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
