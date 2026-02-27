import type { Group } from '../components/export-diff-viewer/types'
import { loadCheckpoints } from './checkpoints'

const GROUPS_KEY = 'wsd:groups'

export function loadGroups(): Group[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY)
    if (raw) return JSON.parse(raw) as Group[]
  } catch {
    // fall through to seed
  }
  return seedFromCheckpoints()
}

export function saveGroups(groups: Group[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

export function addGroup(name: string): Group {
  const groups = loadGroups()
  const existing = groups.find((g) => g.name === name)
  if (existing) return existing

  const group: Group = {
    id: `g-${Date.now()}`,
    name,
    lastSyncedAt: null,
    lastSyncedMessagePreview: null,
  }
  groups.push(group)
  saveGroups(groups)
  return group
}

export function updateGroupSync(groupId: string, syncedAt: string, preview: string | null) {
  const groups = loadGroups()
  const group = groups.find((g) => g.id === groupId)
  if (group) {
    group.lastSyncedAt = syncedAt
    group.lastSyncedMessagePreview = preview
    saveGroups(groups)
  }
}

export function suggestGroup(filename: string, groups: Group[]): string | undefined {
  const lower = filename.toLowerCase()
  for (const g of groups) {
    if (lower.includes(g.name.toLowerCase())) return g.id
  }
  return undefined
}

function seedFromCheckpoints(): Group[] {
  const checkpoints = loadCheckpoints()
  const groups: Group[] = Object.entries(checkpoints).map(([name, isoDate], i) => ({
    id: `g-seed-${i}`,
    name,
    lastSyncedAt: isoDate,
    lastSyncedMessagePreview: null,
  }))
  if (groups.length > 0) saveGroups(groups)
  return groups
}
