import { GamepadIcon, Star } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { CONDITION_COLORS } from '@/types'
import type { Game } from '@/types'

interface CollectionStatsProps {
  games: Game[]
}

export default function CollectionStats({ games }: CollectionStatsProps) {
  const { theme } = useTheme()

  const collectionGames = games.filter(g => !g.is_wishlist)
  const wishlistGames = games.filter(g => g.is_wishlist)
  const totalGames = collectionGames.length
  const sealedCount = collectionGames.filter(g => g.condition === 'Sealed').length

  const conditionCounts = collectionGames.reduce((acc, g) => {
    acc[g.condition] = (acc[g.condition] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sectionStyle = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: '0.75rem',
    padding: '20px 24px',
  }

  const statCards = [
    {
      title: 'Total Games',
      value: totalGames,
      sub: `${wishlistGames.length} on wishlist`,
      Icon: GamepadIcon,
      color: theme.accent,
    },
    {
      title: 'Sealed',
      value: sealedCount,
      sub: `${Math.round((sealedCount / Math.max(totalGames, 1)) * 100)}% of collection`,
      Icon: Star,
      color: '#f59e0b',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(card => (
          <div key={card.title} style={sectionStyle}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: theme.text2 }}>{card.title}</p>
                <p className="text-2xl font-bold" style={{ color: theme.text }}>{card.value}</p>
                <p className="text-xs mt-1" style={{ color: theme.text2 }}>{card.sub}</p>
              </div>
              {card.Icon && (
                <div style={{ background: card.color + '20', borderRadius: '0.5rem', padding: '10px' }}>
                  <card.Icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalGames > 0 && (
        <div style={sectionStyle}>
          <h3 className="text-base font-semibold mb-4" style={{ color: theme.text }}>Condition breakdown</h3>
          <div className="space-y-3">
            {Object.entries(conditionCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([condition, count]) => {
                const color = CONDITION_COLORS[condition] ?? '#94a3b8'
                const pct = Math.round((count / totalGames) * 100)
                return (
                  <div key={condition} className="flex items-center gap-3">
                    <span className="text-sm w-20 shrink-0" style={{ color: theme.text }}>{condition}</span>
                    <div className="flex-1 rounded-full h-2" style={{ background: theme.surface2 }}>
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right shrink-0" style={{ color: theme.text2 }}>{count}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
