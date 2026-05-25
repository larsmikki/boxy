import { Link } from 'react-router-dom'
import { Gamepad2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function NotFound() {
  const { theme } = useTheme()

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Gamepad2 className="h-14 w-14 mb-4 text-text2" aria-hidden="true" />
      <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-text">404</h1>
      <p className="text-sm mb-6 text-text2">Page not found</p>
      <Link
        to="/"
        className="text-sm font-medium underline"
        style={{ color: theme.accent }}
      >
        Return home
      </Link>
    </div>
  )
}
