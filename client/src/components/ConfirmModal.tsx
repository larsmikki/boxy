import { useTheme } from '@/contexts/ThemeContext'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
}

export default function ConfirmModal({
  isOpen, title, description, onConfirm, onCancel, confirmLabel = 'Confirm', danger = true,
}: ConfirmModalProps) {
  const { theme } = useTheme()
  if (!isOpen) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{
        background: theme.surface, border: `1px solid ${theme.border}`,
        borderRadius: '0.75rem', padding: '24px', maxWidth: '400px', width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
          {title}
        </h2>
        <p style={{ fontSize: '0.875rem', color: theme.text2, marginBottom: '20px' }}>
          {description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', borderRadius: '6px',
              border: `1px solid ${theme.border}`, background: theme.surface2,
              color: theme.text, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none',
              background: danger ? '#ef4444' : theme.accent,
              color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
