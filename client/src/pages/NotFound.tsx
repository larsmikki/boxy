import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'

export default function NotFound() {
  const { theme } = useTheme()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-4">🎮</div>
      <h1 className="text-4xl font-extrabold mb-2" style={{ color: theme.text }}>404</h1>
      <p className="text-lg mb-6" style={{ color: theme.text2 }}>Page not found</p>
      <Link
        to="/"
        style={{ color: theme.accent, textDecoration: 'underline', fontSize: '0.875rem' }}
      >
        Return to Home
      </Link>
    </div>
  )
}
