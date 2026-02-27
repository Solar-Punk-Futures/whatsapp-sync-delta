import { cn } from "../../lib/utils"
import { PanelLeftClose, PanelLeft, Menu, X } from "lucide-react"
import { useState } from "react"
import { MainNav, type NavigationItem } from "./MainNav"
import { UserMenu } from "./UserMenu"

interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  user?: { name: string; avatarUrl?: string }
  onNavigate?: (href: string) => void
  onLogout?: () => void
}

export function AppShell({
  children,
  navigationItems,
  user,
  onNavigate,
  onLogout,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 font-[Inter] dark:bg-zinc-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-zinc-200 bg-white transition-all duration-200 dark:border-zinc-700 dark:bg-zinc-900",
          collapsed ? "w-16" : "w-60",
          // Mobile: overlay sidebar
          "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-zinc-200 px-3 dark:border-zinc-700",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              WA Sync
            </span>
          )}
          <button
            onClick={() => {
              setCollapsed(!collapsed)
              setMobileOpen(false)
            }}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-1 flex-col overflow-y-auto px-2">
          <MainNav
            items={navigationItems}
            collapsed={collapsed}
            onNavigate={(href) => {
              onNavigate?.(href)
              setMobileOpen(false)
            }}
          />
        </div>

        {/* User menu */}
        {user && (
          <div className="border-t border-zinc-200 px-2 py-2 dark:border-zinc-700">
            <UserMenu user={user} collapsed={collapsed} onLogout={onLogout} />
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex h-14 items-center border-b border-zinc-200 px-4 lg:hidden dark:border-zinc-700">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
          <span className="ml-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            WA Sync
          </span>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
