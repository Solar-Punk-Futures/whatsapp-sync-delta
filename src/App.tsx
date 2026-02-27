import { useMemo, useState } from 'react'
import { parseCheckpointOverride, parseDateTimeLocalInput, parseWhatsappText, toDatetimeLocalValue, type ParsedMessage } from './parsers'
import './index.css'

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
  const [lastSyncedAtTextInput, setLastSyncedAtTextInput] = useState('')
  const [status, setStatus] = useState('')

  const parsedInputDate = useMemo(() => {
    if (!lastSyncedAtInput) return null
    return parseDateTimeLocalInput(lastSyncedAtInput)
  }, [lastSyncedAtInput])

  const parsedTextInputDate = useMemo(() => {
    if (!lastSyncedAtTextInput) return null
    return parseCheckpointOverride(lastSyncedAtTextInput)
  }, [lastSyncedAtTextInput])

  const hasInvalidInputDate = Boolean(lastSyncedAtInput) && !parsedInputDate
  const hasInvalidTextInputDate = Boolean(lastSyncedAtTextInput) && !parsedTextInputDate

  const storedCheckpointDate = useMemo(() => {
    const fromStore = checkpoints[chatName]
    if (!fromStore) return null
    const d = new Date(fromStore)
    return Number.isNaN(d.getTime()) ? null : d
  }, [chatName, checkpoints])

  const lastSyncedAt = useMemo(() => {
    if (lastSyncedAtTextInput) return parsedTextInputDate
    if (lastSyncedAtInput) return parsedInputDate
    return storedCheckpointDate
  }, [lastSyncedAtTextInput, parsedTextInputDate, lastSyncedAtInput, parsedInputDate, storedCheckpointDate])

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
    setLastSyncedAtTextInput('')
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

        <label>
          Or paste a WhatsApp timestamp (optional override)
          <input
            type="text"
            value={lastSyncedAtTextInput}
            onChange={(e) => setLastSyncedAtTextInput(e.target.value)}
            placeholder="[25/02/26, 7:03:37 PM]"
          />
        </label>

        {hasInvalidInputDate && (
          <p className="status">Invalid picker override date format.</p>
        )}

        {hasInvalidTextInputDate && (
          <p className="status">Invalid text override. Use format like [25/02/26, 7:03:37 PM].</p>
        )}

        <div className="row">
          <button onClick={copyFresh}>Copy fresh messages</button>
          <button onClick={persistCheckpoint}>Mark synced up to current point</button>
        </div>

        <div className="stats">
          <span>Total parsed: {messages.length}</span>
          <span>Fresh messages: {freshMessages.length}</span>
          <span>Fresh attachments: {freshAttachments.length}</span>
          <span>Stored checkpoint: {storedCheckpointDate ? storedCheckpointDate.toLocaleString() : 'none'}</span>
          <span>
            Active cutoff: {lastSyncedAt ? toDatetimeLocalValue(lastSyncedAt) : 'none'}
            {lastSyncedAtTextInput
              ? ' (from text override)'
              : lastSyncedAtInput
                ? ' (from picker override)'
                : ' (from stored checkpoint)'}
          </span>
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
