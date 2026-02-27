import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from './components/shell'
import type { NavigationItem } from './components/shell'
import { ExportPage } from './pages/ExportPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

const NAV_ITEMS: Omit<NavigationItem, 'isActive'>[] = [
  { label: 'Daily Checklist', href: '/today', icon: 'today' },
  { label: 'Export Diff', href: '/export', icon: 'export' },
  { label: 'Groups', href: '/groups', icon: 'groups' },
  { label: 'Sync History', href: '/history', icon: 'history' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
]

const user = { name: 'Demo User' }

function App() {
  const location = useLocation()
  const navigate = useNavigate()

  const navigationItems: NavigationItem[] = NAV_ITEMS.map((item) => ({
    ...item,
    isActive: location.pathname === item.href,
  }))

  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      onNavigate={(href) => navigate(href)}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/export" replace />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/today" element={<PlaceholderPage title="Daily Checklist" />} />
        <Route path="/groups" element={<PlaceholderPage title="Group Management" />} />
        <Route path="/history" element={<PlaceholderPage title="Sync History" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
      </Routes>
    </AppShell>
  )
}

export default App
