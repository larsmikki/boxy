import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui'
import Layout from '@/components/Layout'
import FrontPage from '@/pages/FrontPage'
import DonatePage from '@/pages/DonatePage'
import SettingsPage from '@/pages/SettingsPage'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<FrontPage />} />
              <Route path="/donate" element={<DonatePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}
