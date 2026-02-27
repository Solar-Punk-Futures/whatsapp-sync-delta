import type { ExportDiffViewerProps } from "./types"
import {
  MessageSquarePlus,
  Paperclip,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react"
import { useState } from "react"
import { cn } from "../../lib/utils"
import { DropZone } from "./DropZone"
import { GroupSelector } from "./GroupSelector"
import { MessageBubble } from "./MessageBubble"
import { MediaPanel } from "./MediaPanel"

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const sameDay = s.toDateString() === e.toDateString()
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  }
  if (sameDay) {
    return `${s.toLocaleDateString([], { month: "short", day: "numeric" })} · ${s.toLocaleTimeString([], timeOpts)} – ${e.toLocaleTimeString([], timeOpts)}`
  }
  return `${s.toLocaleDateString([], { month: "short", day: "numeric" })} – ${e.toLocaleDateString([], { month: "short", day: "numeric" })}`
}

export function ExportDiffViewer({
  groups,
  suggestedGroupId,
  uploadedFileName,
  newMessages,
  previousMessages,
  mediaAttachments,
  summary,
  onGroupSelect,
  onFileUpload,
  onMarkSynced,
}: ExportDiffViewerProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    undefined
  )

  const hasResults = newMessages.length > 0 || previousMessages.length > 0
  const canSync = hasResults && selectedGroupId

  function handleGroupSelect(id: string) {
    setSelectedGroupId(id)
    onGroupSelect?.(id)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Export Diff Viewer
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Upload a WhatsApp export to see what's new since the last sync.
        </p>
      </div>

      {/* Group selector + file info bar */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Group
          </label>
          <GroupSelector
            groups={groups}
            selectedGroupId={selectedGroupId}
            suggestedGroupId={suggestedGroupId}
            onGroupSelect={handleGroupSelect}
          />
        </div>

        {uploadedFileName && (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
            <FileText className="size-4 text-zinc-400" />
            <span className="truncate font-mono text-xs text-zinc-600 dark:text-zinc-400">
              {uploadedFileName}
            </span>
          </div>
        )}
      </div>

      {/* Empty state: Drop zone */}
      {!hasResults && (
        <DropZone onFileUpload={onFileUpload} />
      )}

      {/* Results state */}
      {hasResults && (
        <>
          {/* Summary stats bar */}
          {summary && (
            <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
              <div className="flex items-center gap-1.5">
                <MessageSquarePlus className="size-4 text-emerald-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {summary.newMessageCount}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  new messages
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Paperclip className="size-4 text-amber-500" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {summary.mediaAttachmentCount}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  attachments
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-4 text-zinc-400" />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDateRange(summary.dateRangeStart, summary.dateRangeEnd)}
                </span>
              </div>

              <div className="ml-auto">
                <button
                  onClick={() => onMarkSynced?.()}
                  disabled={!canSync}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                    canSync
                      ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                      : "cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                  )}
                >
                  <CheckCircle2 className="size-4" />
                  Mark as Synced
                </button>
              </div>
            </div>
          )}

          {/* Split view */}
          <div className="grid gap-5 lg:grid-cols-5">
            {/* New messages panel — takes more space */}
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/10">
                <div className="flex items-center gap-2 border-b border-emerald-200/60 px-4 py-3 dark:border-emerald-900/40">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    New Messages
                  </h2>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium tabular-nums text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    {newMessages.length}
                  </span>
                </div>
                <div className="max-h-[32rem] space-y-1 overflow-y-auto p-3">
                  {newMessages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} variant="new" />
                  ))}
                </div>
              </div>

              {/* Media panel below new messages */}
              <div className="mt-5">
                <MediaPanel attachments={mediaAttachments} />
              </div>
            </div>

            {/* Previous messages panel */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/30">
                <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-700">
                  <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    Previous Messages
                  </h2>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                    {previousMessages.length}
                  </span>
                </div>
                <div className="max-h-[32rem] space-y-0.5 overflow-y-auto p-3">
                  {previousMessages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      variant="previous"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
