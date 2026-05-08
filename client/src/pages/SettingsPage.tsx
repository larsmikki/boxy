import { useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import ThemePicker from '@/components/ThemePicker'
import { useCardSize } from '@/hooks/useCardSize'
import { useToast } from '@/contexts/ToastContext'
import { deleteAllGames } from '@/lib/db'

const DELETE_PHRASE = 'Yes, delete all games.'

export default function SettingsPage() {
  const { theme } = useTheme()
  const { toast } = useToast()
  const importRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const { cardSize, setCardSize } = useCardSize()

  const sectionStyle = {
    background: theme.surface, border: `1px solid ${theme.border}`,
    borderRadius: '16px', padding: '24px', marginBottom: '20px',
  }

  const btnStyle = (active = false) => ({
    display: 'inline-flex' as const, alignItems: 'center' as const, gap: '6px',
    padding: '8px 16px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 500,
    cursor: 'pointer',
    background: active ? `${theme.accent}15` : theme.surface2,
    color: active ? theme.accent : theme.text,
    border: active ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
    boxShadow: active ? `0 0 0 3px ${theme.accent}15` : 'none',
  })

  const inputStyle = {
    padding: '7px 12px', borderRadius: '0.375rem',
    border: `1px solid ${theme.border}`, background: theme.surface2,
    color: theme.text, fontSize: '0.875rem', outline: 'none',
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const games = await fetch('/api/games').then(r => r.json())
      const gamesWithImages = await Promise.all(games.map(async (game: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { edition, current_price, ...rest } = game
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
      toast({ title: 'Backup exported', description: `${games.length} games saved to file.` })
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllGames()
      toast({ title: 'All games deleted', description: 'Your collection has been cleared.' })
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
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
        toast({
          title: 'Import complete',
          description: added > 0 ? `${added} new games added.` : 'No new games found (all already exist).',
        })
      } catch (err: any) {
        toast({ title: 'Import failed', description: err.message || 'Could not import backup file.', variant: 'destructive' })
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
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.text }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: theme.text2 }}>Customize your Boxy experience.</p>
      </div>

      {/* Themes */}
      <div style={sectionStyle}>
        <h2 className="text-base font-bold mb-1" style={{ color: theme.text }}>Themes</h2>
        <p className="text-xs mb-5" style={{ color: theme.text2 }}>Choose how Boxy looks to you.</p>
        <ThemePicker />
      </div>

      {/* Card Size */}
      <div style={sectionStyle}>
        <h2 className="text-base font-bold mb-1" style={{ color: theme.text }}>Card size</h2>
        <p className="text-xs mb-5" style={{ color: theme.text2 }}>Controls how large game cards appear in your collection.</p>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map(size => (
            <button
              key={size}
              style={btnStyle(cardSize === size)}
              onClick={() => setCardSize(size)}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Data */}
      <div style={sectionStyle}>
        <h2 className="text-base font-bold mb-1" style={{ color: theme.text }}>Data</h2>
        <p className="text-xs mb-5" style={{ color: theme.text2 }}>
          Export a backup of your collection or restore from a previous backup.
          Importing only adds new games — existing ones are never overwritten.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all hover:opacity-80"
            style={{ background: theme.surface2, color: theme.text, border: `1px solid ${theme.border}`, opacity: exporting ? 0.6 : 1 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {exporting ? 'Exporting…' : 'Export Backup'}
          </button>
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all hover:opacity-80"
            style={{ background: theme.surface2, color: theme.text, border: `1px solid ${theme.border}`, opacity: importing ? 0.6 : 1 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {importing ? 'Importing…' : 'Import Backup'}
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button
            style={{ ...btnStyle(), color: '#dc2626', borderColor: '#fca5a5' }}
            onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText('') }}
          >
            Delete All Games
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="mt-4 p-4 rounded-lg" style={{ background: '#fff1f2', border: '1px solid #fca5a5' }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#991b1b' }}>
              This will permanently delete all games and wishlist items.
            </p>
            <p className="text-sm mb-3" style={{ color: '#7f1d1d' }}>
              Type <strong>{DELETE_PHRASE}</strong> to confirm.
            </p>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={DELETE_PHRASE}
                style={{ ...inputStyle, background: '#fff', color: '#1a1a2e', width: '240px', border: '1px solid #fca5a5' }}
              />
              <button
                style={{
                  ...btnStyle(),
                  background: deleteConfirmText === DELETE_PHRASE ? '#dc2626' : '#fca5a5',
                  color: '#fff', border: 'none',
                  cursor: deleteConfirmText === DELETE_PHRASE ? 'pointer' : 'not-allowed',
                }}
                disabled={deleteConfirmText !== DELETE_PHRASE}
                onClick={handleDeleteAll}
              >
                Confirm Delete
              </button>
              <button style={btnStyle()} onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
