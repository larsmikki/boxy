export interface Game {
  id: string
  title: string
  condition: string
  image_url?: string
  notes?: string
  is_wishlist: boolean
  created_at: string
  updated_at: string
}

export const CONDITIONS = ['Sealed', 'Excellent', 'Good', 'Fair', 'Poor'] as const
export type Condition = typeof CONDITIONS[number]

export const CONDITION_COLORS: Record<string, string> = {
  Sealed:    '#f59e0b',
  Excellent: '#06b6d4',
  Good:      '#65a30d',
  Fair:      '#8b5cf6',
  Poor:      '#ef4444',
}
