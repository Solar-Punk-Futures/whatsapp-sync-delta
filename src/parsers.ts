export type ParsedMessage = {
  id: string
  rawTimestamp: string
  timestamp: Date
  sender: string
  text: string
}

export function normalizeTimestamp(raw: string): string {
  return raw.replace(/[\u200e\u200f\u200b\u200c\u200d\uFEFF]/g, '').replace(/\u202f/g, ' ').trim()
}

function stripInvisible(line: string): string {
  return line.replace(/^[\u200e\u200f\u200b\u200c\u200d\uFEFF]+/, '')
}

export function parseWhatsappDate(raw: string): Date | null {
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

export function parseWhatsappText(content: string): ParsedMessage[] {
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
    const match = stripInvisible(line).match(header)
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

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function parseDateTimeLocalInput(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) return null

  const [, year, month, day, hour, minute] = match
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
  )
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseCheckpointOverride(raw: string): Date | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const unwrapped = trimmed.match(/^\[(.*)\]$/)?.[1]?.trim() ?? trimmed

  const whatsappDate = parseWhatsappDate(unwrapped)
  if (whatsappDate) return whatsappDate

  return parseDateTimeLocalInput(trimmed)
}
