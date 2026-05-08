import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastItem extends ToastOptions {
  id: number
}

interface ToastContextType {
  toast: (opts: ToastOptions) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {}, dismiss: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((opts: ToastOptions) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { ...opts, id }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <Toaster toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

function Toaster({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div style={{
      position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '360px', width: '100%',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: t.variant === 'destructive' ? '#fef2f2' : '#ffffff',
            border: `1px solid ${t.variant === 'destructive' ? '#fca5a5' : '#e5e7eb'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px',
            animation: 'toast-in 0.2s ease',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {t.title && (
              <p style={{
                fontSize: '0.875rem', fontWeight: 600, margin: 0,
                color: t.variant === 'destructive' ? '#dc2626' : '#111827',
              }}>
                {t.title}
              </p>
            )}
            {t.description && (
              <p style={{
                fontSize: '0.8125rem', margin: 0, marginTop: t.title ? '2px' : 0,
                color: t.variant === 'destructive' ? '#991b1b' : '#6b7280',
              }}>
                {t.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
              color: '#9ca3af', fontSize: '16px', lineHeight: 1, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
