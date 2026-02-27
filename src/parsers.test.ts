import { describe, expect, it } from 'vitest'
import { parseCheckpointOverride, parseDateTimeLocalInput, parseWhatsappDate } from './parsers'

describe('parseWhatsappDate', () => {
  it('parses whatsapp timestamp with PM correctly', () => {
    const d = parseWhatsappDate('25/02/26, 7:03:37 PM')
    expect(d).not.toBeNull()
    expect(d?.getFullYear()).toBe(2026)
    expect(d?.getMonth()).toBe(1)
    expect(d?.getDate()).toBe(25)
    expect(d?.getHours()).toBe(19)
    expect(d?.getMinutes()).toBe(3)
    expect(d?.getSeconds()).toBe(37)
  })

  it('returns null for invalid format', () => {
    expect(parseWhatsappDate('2026-02-25 19:03:37')).toBeNull()
  })
})

describe('parseDateTimeLocalInput', () => {
  it('parses datetime-local format', () => {
    const d = parseDateTimeLocalInput('2026-02-25T19:03')
    expect(d).not.toBeNull()
    expect(d?.getFullYear()).toBe(2026)
    expect(d?.getMonth()).toBe(1)
    expect(d?.getDate()).toBe(25)
    expect(d?.getHours()).toBe(19)
    expect(d?.getMinutes()).toBe(3)
    expect(d?.getSeconds()).toBe(0)
  })
})

describe('parseCheckpointOverride', () => {
  it('accepts bracketed whatsapp timestamps', () => {
    const d = parseCheckpointOverride('[25/02/26, 7:03:37 PM]')
    expect(d).not.toBeNull()
    expect(d?.getHours()).toBe(19)
    expect(d?.getSeconds()).toBe(37)
  })

  it('falls back to datetime-local format', () => {
    const d = parseCheckpointOverride('2026-02-25T19:03')
    expect(d).not.toBeNull()
    expect(d?.getHours()).toBe(19)
    expect(d?.getSeconds()).toBe(0)
  })

  it('returns null for junk input', () => {
    expect(parseCheckpointOverride('potato')).toBeNull()
  })
})
