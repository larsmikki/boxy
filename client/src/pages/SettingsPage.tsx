import { useRef, useState } from 'react'
import { Download, Trash2, Upload } from 'lucide-react'
import ThemePicker from '@/components/ThemePicker'
import { useCardSize } from '@/hooks/useCardSize'
import { Button, Input, Modal, Surface, useToast } from '@/components/ui'
import { deleteAllGames } from '@/api'

const DELETE_PHRASE = 'Yes, delete all games.'

interface ExportGame {
  edition?: unknown
  current_price?: unknown
  image_url?: string
  [key: string]: unknown
}

export default function SettingsPage() {
  const { addToast } = useToast()
  const importRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const { cardSize, setCardSize } = useCardSize()

  const handleExport = async () => {
    setExporting(true)
    try {
      const games = await fetch('/api/games').then(r => r.json()) as ExportGame[]
      const gamesWithImages = await Promise.all(games.map(async (game) => {
        const { edition: _edition, current_price: _currentPrice, ...rest } = game
        void _edition
        void _currentPrice
        if (!rest.image_url?.startsWith('/api/images/')) return rest
        try {
          const res = await fetch(rest.image_url)
          if (!res.ok) return rest
          const blob = await res.blob()
          const image_data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          return { ...rest, image_data }
        } catch {
          return rest
        }
      }))
      const blob = new Blob([JSON.stringify({ games: gamesWithImages }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `boxy-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      addToast(`Backup exported - ${games.length} games saved to file.`, 'success')
    } catch {
      addToast('Export failed', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllGames()
      addToast('All games deleted - your collection has been cleared.', 'success')
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    } catch {
      addToast('Delete failed', 'error')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (!data || !Array.isArray(data.games)) throw new Error('Invalid backup format')
        const res = await fetch('/api/games/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ games: data.games }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result?.error || `Server error ${res.status}`)
        const { added } = result
        addToast(
          added > 0 ? `Import complete - ${added} new games added.` : 'Import complete - no new games found.',
          'success',
        )
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not import backup file.'
        addToast(`Import failed - ${message}`, 'error')
      } finally {
        setImporting(false)
        if (importRef.current) importRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-text">Settings</h1>
        <p className="text-sm mt-0.5 text-text2">Customize your Boxy experience.</p>
      </div>

      <Surface className="p-6 mb-5">
        <h2 className="text-base font-bold mb-1 text-text">Themes</h2>
        <p className="text-xs mb-5 text-text2">Choose how Boxy looks to you.</p>
        <ThemePicker />
      </Surface>

      <Surface className="p-6 mb-5">
        <h2 className="text-base font-bold mb-1 text-text">Layout</h2>
        <p className="text-xs mb-5 text-text2">Controls how large game cards appear in your collection.</p>
        <div className="grid grid-cols-3 gap-2">
          {(['small', 'medium', 'large'] as const).map(size => {
            const active = cardSize === size
            return (
              <button
                key={size}
                type="button"
                className="px-3 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: active ? 'rgb(from var(--color-accent) r g b / 0.15)' : 'var(--color-surface2)',
                  border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color: active ? 'var(--color-accent)' : 'var(--color-text2)',
                  boxShadow: active ? '0 0 0 3px rgb(from var(--color-accent) r g b / 0.15)' : 'none',
                }}
                onClick={() => setCardSize(size)}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            )
          })}
        </div>
      </Surface>

      <Surface className="p-6">
        <h2 className="text-base font-bold mb-1 text-text">Data</h2>
        <p className="text-xs mb-5 text-text2">
          Export a backup of your collection or restore from a previous backup.
          Importing only adds new games; existing ones are never overwritten.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            leadingIcon={<Download className="h-4 w-4" />}
          >
            {exporting ? 'Exporting...' : 'Export backup'}
          </Button>
          <Button
            type="button"
            onClick={() => importRef.current?.click()}
            disabled={importing}
            leadingIcon={<Upload className="h-4 w-4" />}
          >
            {importing ? 'Importing...' : 'Import backup'}
          </Button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button
            type="button"
            variant="danger"
            onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText('') }}
            leadingIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete all games
          </Button>
        </div>
      </Surface>

      {showDeleteConfirm && (
        <Modal title="Delete all games" onClose={() => setShowDeleteConfirm(false)} maxWidth={520}>
          <div className="p-6">
            <p className="text-sm font-medium text-text">
              This will permanently delete all games and wishlist items.
            </p>
            <p className="text-sm mt-2 mb-4 text-text2">
              Type <strong>{DELETE_PHRASE}</strong> to confirm.
            </p>
            <Input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder={DELETE_PHRASE}
              invalid={deleteConfirmText.length > 0 && deleteConfirmText !== DELETE_PHRASE}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleteConfirmText !== DELETE_PHRASE}
                onClick={handleDeleteAll}
              >
                Confirm delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
