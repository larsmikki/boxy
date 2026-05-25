import { Search } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Input } from '@/components/ui'

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

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: theme.text2 }}
      />
      <Input
        type="text"
        placeholder="Search games..."
        value={filters.search}
        onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
        className="pl-10 rounded-xl"
        style={{ background: theme.surface }}
      />
    </div>
  )
}
