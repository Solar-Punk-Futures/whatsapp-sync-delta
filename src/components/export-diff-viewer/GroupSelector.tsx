import type { Group } from "./types"
import { ChevronDown, Check, AlertCircle } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "../../lib/utils"

interface GroupSelectorProps {
  groups: Group[]
  selectedGroupId?: string
  suggestedGroupId?: string
  onGroupSelect?: (groupId: string) => void
}

function formatSyncDate(dateStr: string | null) {
  if (!dateStr) return "Never synced"
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return "Synced < 1h ago"
  if (diffHours < 24) return `Synced ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `Synced ${diffDays}d ago`
}

export function GroupSelector({
  groups,
  selectedGroupId,
  suggestedGroupId,
  onGroupSelect,
}: GroupSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = groups.find((g) => g.id === selectedGroupId)
  const hasSuggestion = suggestedGroupId && !selectedGroupId

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      {hasSuggestion && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="size-3.5" />
          <span>
            Suggested match:{" "}
            <button
              onClick={() => {
                onGroupSelect?.(suggestedGroupId)
                setOpen(false)
              }}
              className="font-medium underline underline-offset-2 hover:no-underline"
            >
              {groups.find((g) => g.id === suggestedGroupId)?.name}
            </button>
          </span>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
          selected
            ? "border-emerald-200 bg-emerald-50/50 text-zinc-900 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-zinc-100"
            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
        )}
      >
        <span className={cn(selected && "font-medium")}>
          {selected ? selected.name : "Select a group…"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-zinc-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <ul className="max-h-60 overflow-y-auto py-1">
            {groups.map((group) => (
              <li key={group.id}>
                <button
                  onClick={() => {
                    onGroupSelect?.(group.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/50",
                    group.id === selectedGroupId &&
                      "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                >
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      {group.name}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {formatSyncDate(group.lastSyncedAt)}
                    </p>
                  </div>
                  {group.id === selectedGroupId && (
                    <Check className="size-4 text-emerald-500" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
