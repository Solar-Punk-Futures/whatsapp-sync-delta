import { useState, useCallback, useMemo, useRef } from 'react'
import { ExportDiffViewer } from '../components/export-diff-viewer'
import type { Message, MediaAttachment, ExportSummary } from '../components/export-diff-viewer/types'
import { parseWhatsappText, parseCheckpointOverride, parseDateTimeLocalInput, toDatetimeLocalValue, type ParsedMessage } from '../parsers'
import { loadCheckpoints, saveCheckpoints, getCheckpointDate } from '../lib/checkpoints'
import { loadGroups, suggestGroup, updateGroupSync } from '../lib/groups'
import { cn } from '../lib/utils'
import { DropZone } from '../components/export-diff-viewer/DropZone'
import { ChevronDown, Calendar, MessageSquareText } from 'lucide-react'

/** Toggle this to switch between rich component view and raw text view */
const FANCY_VIEW = false

function extractMediaFilename(text: string): string | null {
  const match = text.match(/<attached:\s*([^>]+)>/i)
  return match ? match[1].trim() : null
}

function parsedToMessage(msg: ParsedMessage): Message {
  const mediaFilename = extractMediaFilename(msg.text)
  const content = mediaFilename
    ? msg.text.replace(/<attached:\s*[^>]+>/gi, '').trim()
    : msg.text

  return {
    id: msg.id,
    sender: msg.sender,
    timestamp: msg.timestamp.toISOString(),
    content,
    mediaFilename,
  }
}

function extractAttachments(messages: Message[]): MediaAttachment[] {
  const seen = new Set<string>()
  const attachments: MediaAttachment[] = []
  for (const msg of messages) {
    if (msg.mediaFilename && !seen.has(msg.mediaFilename)) {
      seen.add(msg.mediaFilename)
      attachments.push({
        filename: msg.mediaFilename,
        messageId: msg.id,
        sender: msg.sender,
        timestamp: msg.timestamp,
      })
    }
  }
  return attachments
}

function splitMessages(allMessages: Message[], cutoff: Date | null) {
  if (!cutoff) return { newMsgs: allMessages, prevMsgs: [] as Message[] }
  const t = cutoff.getTime()
  return {
    newMsgs: allMessages.filter((m) => new Date(m.timestamp).getTime() > t),
    prevMsgs: allMessages.filter((m) => new Date(m.timestamp).getTime() <= t),
  }
}

export function ExportPage() {
  const [groups, setGroups] = useState(() => loadGroups())
  const [allMessages, setAllMessages] = useState<Message[]>([])
  const [allParsed, setAllParsed] = useState<ParsedMessage[]>([])
  const [suggestedGroupId, setSuggestedGroupId] = useState<string | undefined>()
  const [uploadedFileName, setUploadedFileName] = useState<string | undefined>()
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>()
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [datePickerValue, setDatePickerValue] = useState('')
  const [textOverride, setTextOverride] = useState('')

  // Store the auto-detected checkpoint so overrides can replace it
  const autoCheckpointRef = useRef<Date | null>(null)

  const parsedPickerDate = useMemo(() => {
    if (!datePickerValue) return null
    return parseDateTimeLocalInput(datePickerValue)
  }, [datePickerValue])

  const parsedTextDate = useMemo(() => {
    if (!textOverride) return null
    return parseCheckpointOverride(textOverride)
  }, [textOverride])

  // Priority: text override > picker override > auto-detected checkpoint
  const effectiveCutoff = useMemo(() => {
    if (textOverride) return parsedTextDate
    if (datePickerValue) return parsedPickerDate
    return autoCheckpointRef.current
  }, [textOverride, parsedTextDate, datePickerValue, parsedPickerDate])

  // Re-split messages whenever cutoff changes
  const { newMsgs, prevMsgs } = useMemo(
    () => splitMessages(allMessages, effectiveCutoff),
    [allMessages, effectiveCutoff]
  )
  const mediaAttachments = useMemo(() => extractAttachments(newMsgs), [newMsgs])
  const summary: ExportSummary | undefined = useMemo(() => {
    if (newMsgs.length === 0) return undefined
    return {
      newMessageCount: newMsgs.length,
      mediaAttachmentCount: mediaAttachments.length,
      dateRangeStart: newMsgs[0].timestamp,
      dateRangeEnd: newMsgs[newMsgs.length - 1].timestamp,
    }
  }, [newMsgs, mediaAttachments])

  // Raw text for non-fancy view
  const freshRawText = useMemo(() => {
    if (FANCY_VIEW) return ''
    const cutoff = effectiveCutoff
    const msgs = cutoff
      ? allParsed.filter((m) => m.timestamp.getTime() > cutoff.getTime())
      : allParsed
    return msgs.map((m) => `[${m.rawTimestamp}] ${m.sender}: ${m.text}`).join('\n')
  }, [allParsed, effectiveCutoff])

  const freshAttachmentsText = useMemo(() => {
    if (FANCY_VIEW) return ''
    const cutoff = effectiveCutoff
    const msgs = cutoff
      ? allParsed.filter((m) => m.timestamp.getTime() > cutoff.getTime())
      : allParsed
    const seen = new Set<string>()
    for (const msg of msgs) {
      const match = msg.text.match(/<attached:\s*([^>]+)>/i)
      if (match) seen.add(match[1].trim())
    }
    return [...seen].join('\n')
  }, [allParsed, effectiveCutoff])

  const hasInvalidPicker = Boolean(datePickerValue) && !parsedPickerDate
  const hasInvalidText = Boolean(textOverride) && !parsedTextDate

  const cutoffSource = textOverride
    ? 'text override'
    : datePickerValue
      ? 'picker override'
      : autoCheckpointRef.current
        ? 'stored checkpoint'
        : null

  const handleFileUpload = useCallback((file: File) => {
    setUploadedFileName(file.name)

    const currentGroups = loadGroups()
    setGroups(currentGroups)
    const suggested = suggestGroup(file.name, currentGroups)
    setSuggestedGroupId(suggested)

    file.text().then((text) => {
      const parsed = parseWhatsappText(text)
      if (parsed.length === 0) {
        setAllMessages([])
        autoCheckpointRef.current = null
        return
      }

      const deduped = new Map<string, ParsedMessage>()
      for (const msg of parsed) deduped.set(msg.id, msg)
      const sorted = [...deduped.values()].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      )

      // Auto-detect checkpoint from group
      const checkpoints = loadCheckpoints()
      let checkpoint: Date | null = null
      if (suggested) {
        const group = currentGroups.find((g) => g.id === suggested)
        if (group?.lastSyncedAt) {
          checkpoint = new Date(group.lastSyncedAt)
        } else if (group) {
          checkpoint = getCheckpointDate(checkpoints, group.name)
        }
      }
      autoCheckpointRef.current = checkpoint

      setAllParsed(sorted)
      setAllMessages(sorted.map(parsedToMessage))
    })
  }, [])

  const handleGroupSelect = useCallback((groupId: string) => {
    setSelectedGroupId(groupId)
  }, [])

  const handleMarkSynced = useCallback(() => {
    const groupId = selectedGroupId
    if (!groupId || newMsgs.length === 0) return

    const lastMsg = newMsgs[newMsgs.length - 1]
    const syncedAt = lastMsg.timestamp

    updateGroupSync(groupId, syncedAt, lastMsg.content.slice(0, 80) || null)

    const group = groups.find((g) => g.id === groupId)
    if (group) {
      const checkpoints = loadCheckpoints()
      checkpoints[group.name] = syncedAt
      saveCheckpoints(checkpoints)
    }

    setGroups(loadGroups())
    autoCheckpointRef.current = new Date(syncedAt)
    setDatePickerValue('')
    setTextOverride('')
  }, [selectedGroupId, newMsgs, groups])

  const overridePanel = (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-6">
      <button
        onClick={() => setOverrideOpen(!overrideOpen)}
        className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
      >
        <ChevronDown className={cn("size-3.5 transition-transform duration-200", overrideOpen && "rotate-180")} />
        Sync point override
      </button>

      {overrideOpen && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <Calendar className="size-3.5" />
                Already synced through
              </label>
              <input
                type="datetime-local"
                value={datePickerValue}
                onChange={(e) => setDatePickerValue(e.target.value)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-200 transition-colors",
                  hasInvalidPicker
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-200 dark:border-zinc-700 focus:border-emerald-300 dark:focus:border-emerald-700"
                )}
              />
              {hasInvalidPicker && (
                <p className="mt-1 text-xs text-red-500">Invalid date format.</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <MessageSquareText className="size-3.5" />
                Or paste a WhatsApp timestamp
              </label>
              <input
                type="text"
                value={textOverride}
                onChange={(e) => setTextOverride(e.target.value)}
                placeholder="[25/02/26, 7:03:37 PM]"
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 transition-colors",
                  hasInvalidText
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-200 dark:border-zinc-700 focus:border-emerald-300 dark:focus:border-emerald-700"
                )}
              />
              {hasInvalidText && (
                <p className="mt-1 text-xs text-red-500">Invalid timestamp. Use format like [25/02/26, 7:03:37 PM]</p>
              )}
            </div>
          </div>

          {effectiveCutoff && (
            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
              Active cutoff: <span className="font-medium text-zinc-600 dark:text-zinc-300">{toDatetimeLocalValue(effectiveCutoff)}</span>
              {cutoffSource && <span className="ml-1">({cutoffSource})</span>}
            </p>
          )}
        </div>
      )}
    </div>
  )

  if (!FANCY_VIEW) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Export Diff Viewer
        </h1>
        <p className="mt-1 mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Upload a WhatsApp export to see what's new since the last sync.
        </p>

        {/* Group selector */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Group
          </label>
          <select
            value={selectedGroupId ?? ''}
            onChange={(e) => {
              if (e.target.value) handleGroupSelect(e.target.value)
            }}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="">Select a group…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Drop zone / file info */}
        {!uploadedFileName ? (
          <div className="mb-5">
            <DropZone onFileUpload={handleFileUpload} />
          </div>
        ) : (
          <div className="mb-5 flex items-center gap-3">
            <p className="text-xs text-zinc-400">Loaded: <span className="font-mono">{uploadedFileName}</span> — {allParsed.length} messages parsed</p>
            <label className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Replace
              <input
                type="file"
                accept=".txt"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                className="hidden"
              />
            </label>
          </div>
        )}

        {overridePanel}

        {/* Stats */}
        {allParsed.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span>Fresh: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{newMsgs.length}</span></span>
            <span>Previous: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{prevMsgs.length}</span></span>
            <span>Attachments: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{mediaAttachments.length}</span></span>
          </div>
        )}

        {/* Fresh messages */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fresh messages</h2>
            <button
              onClick={async () => {
                if (freshRawText) await navigator.clipboard.writeText(freshRawText)
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Copy
            </button>
          </div>
          <textarea
            readOnly
            value={freshRawText}
            rows={14}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>

        {/* Fresh attachments */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fresh attachment files</h2>
            <button
              onClick={async () => {
                if (freshAttachmentsText) await navigator.clipboard.writeText(freshAttachmentsText)
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Copy
            </button>
          </div>
          <textarea
            readOnly
            value={freshAttachmentsText}
            rows={Math.max(4, Math.min(10, freshAttachmentsText.split('\n').length + 1))}
            placeholder="No attachment tags found in fresh messages."
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300"
          />
        </div>

        {/* Mark synced */}
        <button
          onClick={handleMarkSynced}
          disabled={!selectedGroupId || newMsgs.length === 0}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
            selectedGroupId && newMsgs.length > 0
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
          )}
        >
          Mark as Synced
        </button>
      </div>
    )
  }

  return (
    <div>
      <ExportDiffViewer
        groups={groups}
        suggestedGroupId={suggestedGroupId}
        uploadedFileName={uploadedFileName}
        newMessages={newMsgs}
        previousMessages={prevMsgs}
        mediaAttachments={mediaAttachments}
        summary={summary}
        onGroupSelect={handleGroupSelect}
        onFileUpload={handleFileUpload}
        onMarkSynced={handleMarkSynced}
      />
      {overridePanel}
    </div>
  )
}
