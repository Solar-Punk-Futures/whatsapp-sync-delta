import { useMemo, useState } from 'react'
import './index.css'

type ParsedMessage = {
  id: string
  rawTimestamp: string
  timestamp: Date
  sender: string
  text: string
}

type ChatCheckpointMap = Record<string, string>

const CHECKPOINTS_KEY = 'wsd:lastSyncedAtByChat'

function loadCheckpoints(): ChatCheckpointMap {
  try {
    const raw = localStorage.getItem(CHECKPOINTS_KEY)
    return raw ? (JSON.parse(raw) as ChatCheckpointMap) : {}
  } catch {
    return {}
  }
}

function saveCheckpoints(map: ChatCheckpointMap) {
  localStorage.setItem(CHECKPOINTS_KEY, JSON.stringify(map))
}

function normalizeTimestamp(raw: string): string {
  return raw.replace(/\u202f/g, ' ').trim()
}

function parseWhatsappDate(raw: string): Date | null {
  const cleaned = normalizeTimestamp(raw)
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null

  const [, dd, mm, yy, hh, min, sec, ampm] = match
  const year = 2000 + Number(yy)
  const month = Number(mm) - 1
  const day = Number(dd)
  let hour = Number(hh)
  const minute = Number(min)
  const second = Number(sec)

  const upper = ampm.toUpperCase()
  if (upper === 'PM' && hour !== 12) hour += 12
  if (upper === 'AM' && hour === 12) hour = 0

  const date = new Date(year, month, day, hour, minute, second)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseWhatsappText(content: string): ParsedMessage[] {
  const lines = content.split(/\r?\n/)
  const header = /^\[(\d{1,2}\/\d{1,2}\/\d{2},\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M)\]\s([^:]+):\s?(.*)$/

  const messages: ParsedMessage[] = []
  let current: { tsRaw: string; sender: string; text: string } | null = null

  const pushCurrent = () => {
    if (!current) return
    const ts = parseWhatsappDate(current.tsRaw)
    if (!ts) {
      current = null
      return
    }
    const text = current.text.trim()
    messages.push({
      id: `${normalizeTimestamp(current.tsRaw)}|${current.sender.trim()}|${text}`,
      rawTimestamp: normalizeTimestamp(current.tsRaw),
      timestamp: ts,
      sender: current.sender.trim(),
      text,
    })
    current = null
  }

  for (const line of lines) {
    const match = line.match(header)
    if (match) {
      pushCurrent()
      current = {
        tsRaw: match[1],
        sender: match[2],
        text: match[3] ?? '',
      }
    } else if (current) {
      current.text += `\n${line}`
    }
  }

  pushCurrent()
  return messages
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function extractAttachmentNames(text: string): string[] {
  const matches = text.matchAll(/<attached:\s*([^>]+)>/gi)
  const names: string[] = []
  for (const match of matches) {
    const fileName = (match[1] ?? '').trim()
    if (fileName) names.push(fileName)
  }
  return names
}

function App() {
  const [chatName, setChatName] = useState('ACME x SPF Aadi Villa')
  const [rawText, setRawText] = useState('')
  const [messages, setMessages] = useState<ParsedMessage[]>([])
  const [checkpoints, setCheckpoints] = useState<ChatCheckpointMap>(() => loadCheckpoints())
  const [lastSyncedAtInput, setLastSyncedAtInput] = useState('')
  const [status, setStatus] = useState('')

  const lastSyncedAt = useMemo(() => {
    const fromInput = lastSyncedAtInput ? new Date(lastSyncedAtInput) : null
    if (fromInput && !Number.isNaN(fromInput.getTime())) return fromInput
    const fromStore = checkpoints[chatName]
    if (!fromStore) return null
    const d = new Date(fromStore)
    return Number.isNaN(d.getTime()) ? null : d
  }, [chatName, checkpoints, lastSyncedAtInput])

  const freshMessages = useMemo(() => {
    const deduped = new Map<string, ParsedMessage>()
    for (const msg of messages) deduped.set(msg.id, msg)
    const unique = [...deduped.values()].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    if (!lastSyncedAt) return unique
    return unique.filter((m) => m.timestamp.getTime() > lastSyncedAt.getTime())
  }, [messages, lastSyncedAt])

  const freshText = useMemo(() => {
    return freshMessages
      .map((m) => `[${m.rawTimestamp}] ${m.sender}: ${m.text}`)
      .join('\n')
  }, [freshMessages])

  const freshAttachments = useMemo(() => {
    const deduped = new Set<string>()
    for (const msg of freshMessages) {
      for (const fileName of extractAttachmentNames(msg.text)) deduped.add(fileName)
    }
    return [...deduped]
  }, [freshMessages])

  const freshAttachmentsText = useMemo(() => freshAttachments.join('\n'), [freshAttachments])

  const onUpload = async (file: File | null) => {
    if (!file) return
    const text = await file.text()
    setRawText(text)
    const parsed = parseWhatsappText(text)
    setMessages(parsed)
    setStatus(`Loaded ${parsed.length} messages from ${file.name}`)
  }

  const persistCheckpoint = () => {
    const target = lastSyncedAt ?? (messages.length ? messages[messages.length - 1].timestamp : null)
    if (!target) {
      setStatus('No timestamp available to save.')
      return
    }
    const updated = { ...checkpoints, [chatName]: target.toISOString() }
    setCheckpoints(updated)
    saveCheckpoints(updated)
    setLastSyncedAtInput('')
    setStatus(`Saved checkpoint for "${chatName}" at ${target.toLocaleString()}`)
  }

  const copyFresh = async () => {
    if (!freshText.trim()) {
      setStatus('No fresh messages to copy.')
      return
    }
    await navigator.clipboard.writeText(freshText)
    setStatus(`Copied ${freshMessages.length} fresh messages.`)
  }

  const copyFreshAttachments = async () => {
    if (!freshAttachmentsText.trim()) {
      setStatus('No fresh attachments to copy.')
      return
    }
    await navigator.clipboard.writeText(freshAttachmentsText)
    setStatus(`Copied ${freshAttachments.length} attachment filenames.`)
  }

  return (
    <main className="container">
      <h1>WhatsApp Sync Delta</h1>
      <p className="muted">Upload export text and copy only messages newer than your last sync checkpoint.</p>

      <section className="card">
        <label>
          Chat name
          <input value={chatName} onChange={(e) => setChatName(e.target.value)} placeholder="e.g. ACME x SPF Aadi Villa" />
        </label>

        <label>
          WhatsApp export (.txt)
          <input type="file" accept=".txt,text/plain" onChange={(e) => onUpload(e.target.files?.[0] ?? null)} />
        </label>

        <label>
          Already synced through (optional override)
          <input
            type="datetime-local"
            value={lastSyncedAtInput}
            onChange={(e) => setLastSyncedAtInput(e.target.value)}
          />
        </label>

        <div className="row">
          <button onClick={copyFresh}>Copy fresh messages</button>
          <button onClick={persistCheckpoint}>Mark synced up to current point</button>
        </div>

        <div className="stats">
          <span>Total parsed: {messages.length}</span>
          <span>Fresh messages: {freshMessages.length}</span>
          <span>Fresh attachments: {freshAttachments.length}</span>
          <span>Stored checkpoint: {checkpoints[chatName] ? new Date(checkpoints[chatName]).toLocaleString() : 'none'}</span>
          <span>Active cutoff: {lastSyncedAt ? toDatetimeLocalValue(lastSyncedAt) : 'none'}</span>
        </div>

        {status && <p className="status">{status}</p>}
      </section>

      <section className="card">
        <h2>Fresh messages</h2>
        <textarea readOnly value={freshText} rows={14} />
      </section>

      <section className="card">
        <h2>Fresh attachment files</h2>
        <div className="row">
          <button onClick={copyFreshAttachments}>Copy attachment filenames</button>
        </div>
        <textarea
          readOnly
          value={freshAttachmentsText}
          rows={Math.max(6, Math.min(14, freshAttachments.length + 2))}
          placeholder="No attachment tags found in fresh messages."
        />
      </section>

      <section className="card">
        <h2>Raw preview</h2>
        <textarea readOnly value={rawText} rows={8} />
      </section>
    </main>
  )
}

export default App
