import { cn } from "../../lib/utils"
import {
  CalendarCheck,
  FileSearch,
  Users,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  today: CalendarCheck,
  export: FileSearch,
  groups: Users,
  history: History,
  settings: Settings,
}

export interface NavigationItem {
  label: string
  href: string
  icon: string
  isActive?: boolean
}

interface MainNavProps {
  items: NavigationItem[]
  collapsed?: boolean
  onNavigate?: (href: string) => void
}

export function MainNav({ items, collapsed = false, onNavigate }: MainNavProps) {
  const mainItems = items.filter((item) => item.icon !== "settings")
  const bottomItems = items.filter((item) => item.icon === "settings")

  return (
    <nav className="flex flex-1 flex-col justify-between py-2">
      <ul className="flex flex-col gap-1">
        {mainItems.map((item) => {
          const Icon = iconMap[item.icon] ?? CalendarCheck
          return (
            <li key={item.href}>
              <button
                onClick={() => onNavigate?.(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                  collapsed && "justify-center px-0",
                  item.isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0",
                    item.isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </button>
            </li>
          )
        })}
      </ul>

      {bottomItems.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-zinc-200 pt-2 dark:border-zinc-700">
          {bottomItems.map((item) => {
            const Icon = iconMap[item.icon] ?? Settings
            return (
              <li key={item.href}>
                <button
                  onClick={() => onNavigate?.(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                    collapsed && "justify-center px-0",
                    item.isActive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0",
                      item.isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
