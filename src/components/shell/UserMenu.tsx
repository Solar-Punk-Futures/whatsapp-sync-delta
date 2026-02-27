import { cn } from "../../lib/utils"
import { LogOut } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface UserMenuProps {
  user: { name: string; avatarUrl?: string }
  collapsed?: boolean
  onLogout?: () => void
}

export function UserMenu({ user, collapsed = false, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200",
          "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
          collapsed && "justify-center px-0"
        )}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="size-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            {initials}
          </span>
        )}
        {!collapsed && (
          <span className="truncate font-medium">{user.name}</span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {user.name}
            </p>
          </div>
          <button
            onClick={() => {
              setOpen(false)
              onLogout?.()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
