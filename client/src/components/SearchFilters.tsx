import { useEffect } from 'react'
import { Search } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export interface FilterState {
  search: string
  condition: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface SearchFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export default function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const { theme } = useTheme()

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `#search-input::placeholder { color: ${theme.text}66; }`
    document.head.appendChild(style)
    return () => style.remove()
  }, [theme.text])

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: theme.text2 }}
      />
      <input
        id="search-input"
        type="text"
        placeholder="Search games…"
        value={filters.search}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        style={{
          width: '100%',
          paddingLeft: '40px',
          paddingRight: '12px',
          paddingTop: '10px',
          paddingBottom: '10px',
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          color: theme.text,
          fontSize: '0.875rem',
          outline: 'none',
        }}
      />
    </div>
  )
}
