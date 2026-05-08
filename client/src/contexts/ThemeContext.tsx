import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface ThemeDefinition {
  name: string
  mode: 'light' | 'dark'
  bg: string
  surface: string
  surface2: string
  border: string
  text: string
  text2: string
  accent: string
  gradient: string
  previewColors: string[]
  groupColors: string[]
}

export const THEMES: ThemeDefinition[] = [
  {
    name: 'Default',
    mode: 'light',
    bg: '#f0f2f5', surface: '#ffffff', surface2: '#e8eaed', border: 'rgba(0,0,0,0.09)',
    text: '#1a1a2e', text2: '#6b7280',
    accent: '#65a30d', gradient: 'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)',
    previewColors: ['#e8eaed', '#d1d5db', '#65a30d'],
    groupColors: ['#ffffff'],
  },
  {
    name: 'Rainbow',
    mode: 'light',
    bg: '#f5f0ff', surface: '#ffffff', surface2: '#ede9fe', border: '#ddd6fe',
    text: '#1a1a2e', text2: '#6b5fa0',
    accent: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    previewColors: ['#ede9fe', '#ddd6fe', '#7c3aed'],
    groupColors: ['#ffeaec', '#fef0e0', '#fef6d5', '#e5fdec', '#e4f0fe', '#e9f6fe', '#f2f0fe'],
  },
  {
    name: 'Ocean',
    mode: 'light',
    bg: '#f0f9ff', surface: '#ffffff', surface2: '#e0f2fe', border: '#bae6fd',
    text: '#0c1e3a', text2: '#4a6d8c',
    accent: '#0284c7', gradient: 'linear-gradient(135deg, #0284c7 0%, #0891b2 100%)',
    previewColors: ['#e0f2fe', '#bae6fd', '#0284c7'],
    groupColors: ['#dbeafe', '#ccfbf1', '#cffafe', '#e0f2fe'],
  },
  {
    name: 'Forest',
    mode: 'light',
    bg: '#f0fdf4', surface: '#ffffff', surface2: '#dcfce7', border: '#bbf7d0',
    text: '#052e16', text2: '#4a7c59',
    accent: '#16a34a', gradient: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
    previewColors: ['#dcfce7', '#bbf7d0', '#16a34a'],
    groupColors: ['#dcfce7', '#d1fae5', '#d9f99d', '#bbf7d0'],
  },
  {
    name: 'Sunset',
    mode: 'light',
    bg: '#fffbf0', surface: '#ffffff', surface2: '#fef3c7', border: '#fde68a',
    text: '#1c1009', text2: '#92400e',
    accent: '#d97706', gradient: 'linear-gradient(135deg, #d97706 0%, #dc2626 100%)',
    previewColors: ['#fef3c7', '#fde68a', '#d97706'],
    groupColors: ['#ffe4e6', '#fef3c7', '#fed7aa', '#fecdd3'],
  },
  {
    name: 'Lavender',
    mode: 'light',
    bg: '#faf5ff', surface: '#ffffff', surface2: '#f3e8ff', border: '#e9d5ff',
    text: '#1a0a2e', text2: '#7e5aa2',
    accent: '#9333ea', gradient: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
    previewColors: ['#f3e8ff', '#e9d5ff', '#9333ea'],
    groupColors: ['#f3e8ff', '#fce7f3', '#e9d5ff', '#ede9fe'],
  },
  {
    name: 'Nord',
    mode: 'light',
    bg: '#eceff4', surface: '#ffffff', surface2: '#e5e9f0', border: '#d8dee9',
    text: '#2e3440', text2: '#4c566a',
    accent: '#5e81ac', gradient: 'linear-gradient(135deg, #5e81ac 0%, #81a1c1 100%)',
    previewColors: ['#e5e9f0', '#d8dee9', '#5e81ac'],
    groupColors: ['#e5e9f0', '#d8dee9', '#dbe4ee', '#eceff4'],
  },
  {
    name: 'Mono',
    mode: 'light',
    bg: '#f8f9fa', surface: '#ffffff', surface2: '#f1f3f5', border: '#dee2e6',
    text: '#212529', text2: '#6c757d',
    accent: '#343a40', gradient: 'linear-gradient(135deg, #343a40 0%, #495057 100%)',
    previewColors: ['#f1f3f5', '#e9ecef', '#343a40'],
    groupColors: ['#f8fafc', '#f1f5f9', '#f5f5f5', '#e2e8f0'],
  },
  {
    name: 'Dark',
    mode: 'dark',
    bg: '#0f0f1a', surface: '#1a1a2e', surface2: '#252540', border: 'rgba(255,255,255,0.08)',
    text: '#e8e8f0', text2: '#8888a8',
    accent: '#65a30d', gradient: 'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)',
    previewColors: ['#1a1a2e', '#252540', '#65a30d'],
    groupColors: ['#1e1e32', '#1a2535', '#1e2a1e', '#2a1e2a'],
  },
  {
    name: 'Obsidian',
    mode: 'dark',
    bg: '#111111', surface: '#1c1c1c', surface2: '#2a2a2a', border: 'rgba(255,255,255,0.07)',
    text: '#f0f0f0', text2: '#888888',
    accent: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    previewColors: ['#1c1c1c', '#2a2a2a', '#10b981'],
    groupColors: ['#1c2a24', '#1c2428', '#1c1c28', '#241c2c'],
  },
]

interface ThemeContextType {
  theme: ThemeDefinition
  setThemeByName: (name: string) => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: THEMES[0], setThemeByName: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeDefinition>(() => {
    const stored = localStorage.getItem('boxy-theme')
    return THEMES.find(t => t.name === stored) ?? THEMES[0]
  })

  useEffect(() => {
    localStorage.setItem('boxy-theme', theme.name)
    document.documentElement.classList.toggle('dark', theme.mode === 'dark')
    const root = document.documentElement
    root.style.setProperty('--theme-bg', theme.bg)
    root.style.setProperty('--theme-surface', theme.surface)
    root.style.setProperty('--theme-surface2', theme.surface2)
    root.style.setProperty('--theme-border', theme.border)
    root.style.setProperty('--theme-text', theme.text)
    root.style.setProperty('--theme-text2', theme.text2)
    root.style.setProperty('--theme-accent', theme.accent)
  }, [theme])

  const setThemeByName = (name: string) => {
    const found = THEMES.find(t => t.name === name)
    if (found) setTheme(found)
  }

  return (
    <ThemeContext.Provider value={{ theme, setThemeByName }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
