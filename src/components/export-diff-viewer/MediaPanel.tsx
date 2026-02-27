import type { MediaAttachment } from "./types"
import { Image, FileText, Paperclip, ChevronDown } from "lucide-react"
import { useState } from "react"
import { cn } from "../../lib/utils"

interface MediaPanelProps {
  attachments: MediaAttachment[]
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp")
    return Image
  if (ext === "pdf" || ext === "doc" || ext === "docx") return FileText
  return Paperclip
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function MediaPanel({ attachments }: MediaPanelProps) {
  const [expanded, setExpanded] = useState(true)

  if (attachments.length === 0) return null

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 text-amber-500 dark:text-amber-400" />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Media Attachments
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium tabular-nums text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            {attachments.length}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-zinc-400 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-700">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
            {attachments.map((att) => {
              const Icon = getFileIcon(att.filename)
              return (
                <li
                  key={att.filename}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
                    <Icon className="size-4 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {att.filename}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {att.sender} at {formatTime(att.timestamp)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
