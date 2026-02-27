import type { Message } from "./types"
import { Paperclip } from "lucide-react"
import { cn } from "../../lib/utils"

interface MessageBubbleProps {
  message: Message
  variant: "new" | "previous"
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(timestamp: string) {
  return new Date(timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })
}

// Stable color assignment by sender name
const senderColors = [
  "text-emerald-700 dark:text-emerald-400",
  "text-sky-700 dark:text-sky-400",
  "text-violet-700 dark:text-violet-400",
  "text-amber-700 dark:text-amber-400",
  "text-rose-700 dark:text-rose-400",
  "text-teal-700 dark:text-teal-400",
]

function getSenderColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return senderColors[Math.abs(hash) % senderColors.length]
}

export function MessageBubble({ message, variant }: MessageBubbleProps) {
  const isNew = variant === "new"

  return (
    <div
      className={cn(
        "group rounded-lg px-3.5 py-2.5 transition-colors duration-100",
        isNew
          ? "bg-white shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-800 dark:ring-zinc-700"
          : "bg-transparent"
      )}
    >
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-xs font-semibold",
            isNew
              ? getSenderColor(message.sender)
              : "text-zinc-400 dark:text-zinc-500"
          )}
        >
          {message.sender}
        </span>
        <span className="text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
          {formatDate(message.timestamp)} {formatTime(message.timestamp)}
        </span>
      </div>

      {message.content && (
        <p
          className={cn(
            "mt-0.5 text-sm leading-relaxed",
            isNew
              ? "text-zinc-800 dark:text-zinc-200"
              : "text-zinc-500 dark:text-zinc-400"
          )}
        >
          {message.content}
        </p>
      )}

      {message.mediaFilename && (
        <div
          className={cn(
            "mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
            isNew
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          )}
        >
          <Paperclip className="size-3" />
          <span className="font-mono">{message.mediaFilename}</span>
        </div>
      )}
    </div>
  )
}
