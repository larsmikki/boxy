import { useState } from 'react'

export type CardSize = 'small' | 'medium' | 'large'

const KEY = 'card-size'

export function useCardSize() {
  const [cardSize, setCardSizeState] = useState<CardSize>(
    () => (localStorage.getItem(KEY) as CardSize) ?? 'medium'
  )

  const setCardSize = (size: CardSize) => {
    setCardSizeState(size)
    localStorage.setItem(KEY, size)
  }

  return { cardSize, setCardSize }
}
