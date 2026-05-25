import { useState } from 'react'
import { Loader2, Search, Upload, X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { CONDITIONS } from '@/types'
import type { Game } from '@/types'

interface BoxArtResult {
  thumb: string
  full: string
  title: string
}

async function searchBoxArt(query: string, offset = 0): Promise<BoxArtResult[]> {
  const res = await fetch(`/api/search-images?q=${encodeURIComponent(query)}&offset=${offset}`)
  if (!res.ok) throw new Error('Search failed')
  const { images } = await res.json()
  return images ?? []
}

async function uploadImageBuffer(buffer: ArrayBuffer, contentType: string): Promise<string> {
  const res = await fetch('/api/images', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: buffer,
  })
  if (!res.ok) throw new Error('Upload failed')
  const { url } = await res.json()
  return url
}

async function proxyAndSave(url: string): Promise<string> {
  const res = await fetch(`/api/proxy-and-save?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error('Image fetch failed')
  const { url: savedUrl } = await res.json()
  return savedUrl
}

type FormData = Omit<Game, 'id' | 'created_at' | 'updated_at'>

interface GameFormProps {
  game?: Game
  onSave: (data: FormData) => void
  onCancel: () => void
  isWishlist?: boolean
}

export default function GameForm({ game, onSave, onCancel, isWishlist = false }: GameFormProps) {
  const { theme } = useTheme()

  const [formData, setFormData] = useState<FormData>({
    title: game?.title ?? '',
    condition: game?.condition ?? 'Good',
    image_url: game?.image_url ?? '',
    notes: game?.notes ?? '',
    is_wishlist: game?.is_wishlist ?? isWishlist,
  })

  const [imageUrlInput, setImageUrlInput] = useState('')
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [boxArtResults, setBoxArtResults] = useState<BoxArtResult[]>([])
  const [searchOffset, setSearchOffset] = useState(0)
  const [lastQuery, setLastQuery] = useState('')
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      const url = await uploadImageBuffer(buffer, file.type || 'image/jpeg')
      setFormData(prev => ({ ...prev, image_url: url }))
    } catch {
      // Upload errors are non-blocking; the user can try another source.
    }
  }

  const handleUrlLoad = async () => {
    if (!imageUrlInput.trim()) return
    setIsLoadingUrl(true)
    try {
      const url = await proxyAndSave(imageUrlInput)
      setFormData(prev => ({ ...prev, image_url: url }))
      setImageUrlInput('')
    } catch {
      // Load errors are non-blocking; the user can paste another URL.
    } finally {
      setIsLoadingUrl(false)
    }
  }

  const handleSearchBoxArt = async () => {
    if (!formData.title.trim()) return
    const query = `${formData.title} PC game box art`
    setIsSearching(true)
    setSearchError('')
    setBoxArtResults([])
    setSearchOffset(0)
    setLastQuery(query)
    try {
      const results = await searchBoxArt(query, 0)
      if (results.length === 0) setSearchError('No results found. Try a different title.')
      else setBoxArtResults(results)
    } catch {
      setSearchError('Search failed. Check your connection and try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleLoadMore = async () => {
    const nextOffset = searchOffset + 9
    setIsLoadingMore(true)
    try {
      const results = await searchBoxArt(lastQuery, nextOffset)
      if (results.length > 0) {
        setBoxArtResults(prev => [...prev, ...results])
        setSearchOffset(nextOffset)
      }
    } catch {
      // Existing results remain usable if pagination fails.
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleSelectResult = async (result: BoxArtResult, index: number) => {
    setLoadingIndex(index)
    try {
      const url = await proxyAndSave(result.full).catch(() => proxyAndSave(result.thumb))
      setFormData(prev => ({ ...prev, image_url: url }))
      setBoxArtResults([])
    } catch {
      setSearchError('Could not load that image. Try another.')
    } finally {
      setLoadingIndex(null)
    }
  }

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-text2 mb-1 block">Title *</label>
          <Input
            type="text"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter game title"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-text2 mb-1 block">Box art</label>

          {formData.image_url ? (
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-20 h-28 object-cover rounded-md shadow-sm"
                  style={{ border: `1px solid ${theme.border}` }}
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center bg-danger text-white"
                  aria-label="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="text-xs pt-1 text-text2">
                <p>Box art loaded.</p>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  className="mt-1 underline"
                  style={{ color: theme.accent }}
                >
                  Change image
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <Button
                  type="button"
                  leadingIcon={<Upload className="w-4 h-4" />}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  Upload file
                </Button>
                <Button
                  type="button"
                  leadingIcon={isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  onClick={handleSearchBoxArt}
                  disabled={isSearching || !formData.title.trim()}
                >
                  {isSearching ? 'Searching...' : 'Find box art'}
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Or paste image URL..."
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlLoad())}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleUrlLoad}
                  disabled={!imageUrlInput.trim() || isLoadingUrl}
                >
                  {isLoadingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load'}
                </Button>
              </div>
            </div>
          )}

          {searchError && (
            <p className="text-xs mt-1.5 text-danger">{searchError}</p>
          )}

          {boxArtResults.length > 0 && !formData.image_url && (
            <div className="mt-3 space-y-2">
              <div className="grid gap-2 grid-cols-3">
                {boxArtResults.map((result, i) => (
                  <button
                    key={`${result.thumb}-${i}`}
                    type="button"
                    onClick={() => handleSelectResult(result, i)}
                    disabled={loadingIndex !== null}
                    className="relative overflow-hidden rounded-md aspect-[3/4] p-0"
                    style={{
                      border: `1px solid ${theme.border}`,
                      cursor: loadingIndex !== null ? 'wait' : 'pointer',
                      background: theme.surface2,
                    }}
                    title={result.title}
                  >
                    <img
                      src={result.thumb}
                      alt={result.title}
                      className="w-full h-full object-cover block"
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
                    />
                    {loadingIndex === i && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : 'More'}
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => setBoxArtResults([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-text2 mb-1 block">Condition</label>
          <Select
            value={formData.condition}
            onChange={e => setFormData(prev => ({ ...prev, condition: e.target.value }))}
          >
            {CONDITIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-text2 mb-1 block">Notes</label>
          <Textarea
            value={formData.notes ?? ''}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Personal notes about this game..."
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" className="flex-1">
            {game ? 'Update game' : 'Add game'}
          </Button>
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
