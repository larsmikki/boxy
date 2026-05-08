import { useState } from 'react'
import { globalBtnStyle } from '@/lib/styles'
import { X, Upload, Search, Loader2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
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
    } catch { /* silent */ }
  }

  const handleUrlLoad = async () => {
    if (!imageUrlInput.trim()) return
    setIsLoadingUrl(true)
    try {
      const url = await proxyAndSave(imageUrlInput)
      setFormData(prev => ({ ...prev, image_url: url }))
      setImageUrlInput('')
    } catch { /* silent */ }
    finally { setIsLoadingUrl(false) }
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
    } catch { /* silent */ }
    finally { setIsLoadingMore(false) }
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

  const btn = (primary = false, disabled = false) => ({
    ...globalBtnStyle,
    padding: '7px 14px',
    height: 'auto',
    cursor: disabled ? 'not-allowed' as const : 'pointer' as const,
    opacity: disabled ? 0.5 : 1,
    border: primary ? 'none' : `1px solid ${theme.border}`,
    background: primary ? theme.accent : theme.surface2,
    color: primary ? '#fff' : theme.text,
  })

  const label = {
    fontSize: '0.875rem', fontWeight: 500 as const,
    color: theme.text, marginBottom: '6px', display: 'block',
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: '6px',
    border: `1px solid ${theme.border}`, background: theme.surface,
    color: theme.text, fontSize: '0.875rem', outline: 'none',
  }

  return (
    <div
      className="w-full max-w-xl mx-auto"
      style={{
        background: theme.surface, border: `1px solid ${theme.border}`,
        borderRadius: '0.75rem', padding: '24px',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: theme.text }}>
          {game ? 'Edit Game' : `Add ${isWishlist ? 'Wishlist ' : ''}Game`}
        </h2>
        <button type="button" onClick={onCancel} style={{ ...btn(), padding: '6px', height: 'auto' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label style={label}>Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter game title"
            required
            autoFocus
            style={inputStyle}
          />
        </div>

        {/* Box Art */}
        <div>
          <label style={label}>Box Art</label>

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
                  style={{
                    position: 'absolute', top: '-8px', right: '-8px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#ef4444', color: '#fff', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div style={{ color: theme.text2, fontSize: '0.8rem', paddingTop: '4px' }}>
                <p>Box art loaded.</p>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  style={{
                    color: theme.accent, textDecoration: 'underline',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.8rem', padding: 0, marginTop: '4px',
                  }}
                >
                  Change image
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <button type="button" style={btn()} onClick={() => document.getElementById('image-upload')?.click()}>
                  <Upload className="w-4 h-4" /> Upload File
                </button>
                <button
                  type="button"
                  style={btn(false, isSearching || !formData.title.trim())}
                  onClick={handleSearchBoxArt}
                  disabled={isSearching || !formData.title.trim()}
                >
                  {isSearching
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
                    : <><Search className="w-4 h-4" /> Find Box Art</>
                  }
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or paste image URL…"
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlLoad())}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  style={btn(false, !imageUrlInput.trim() || isLoadingUrl)}
                  onClick={handleUrlLoad}
                  disabled={!imageUrlInput.trim() || isLoadingUrl}
                >
                  {isLoadingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load'}
                </button>
              </div>
            </div>
          )}

          {searchError && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>{searchError}</p>
          )}

          {boxArtResults.length > 0 && !formData.image_url && (
            <div className="mt-3 space-y-2">
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {boxArtResults.map((result, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectResult(result, i)}
                    disabled={loadingIndex !== null}
                    style={{
                      position: 'relative', borderRadius: '6px', overflow: 'hidden',
                      border: `1px solid ${theme.border}`,
                      cursor: loadingIndex !== null ? 'wait' : 'pointer',
                      aspectRatio: '3/4', background: theme.surface2, padding: 0,
                    }}
                    title={result.title}
                  >
                    <img
                      src={result.thumb}
                      alt={result.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
                    />
                    {loadingIndex === i && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  style={{ ...btn(false, isLoadingMore), flex: 1, justifyContent: 'center' }}
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</> : 'More'}
                </button>
                <button
                  type="button"
                  style={{ ...btn(), flex: 1, justifyContent: 'center' }}
                  onClick={() => setBoxArtResults([])}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Condition */}
        <div>
          <label style={label}>Condition</label>
          <select
            value={formData.condition}
            onChange={e => setFormData(prev => ({ ...prev, condition: e.target.value }))}
            style={inputStyle}
          >
            {CONDITIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label style={label}>Notes</label>
          <textarea
            value={formData.notes ?? ''}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Personal notes about this game…"
            rows={3}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            style={{ ...btn(true), flex: 1, justifyContent: 'center', height: '40px' }}
          >
            {game ? 'Update Game' : 'Add Game'}
          </button>
          <button type="button" style={{ ...btn(), height: '40px' }} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
