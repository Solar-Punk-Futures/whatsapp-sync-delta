export type ChatCheckpointMap = Record<string, string>

const CHECKPOINTS_KEY = 'wsd:lastSyncedAtByChat'

export function loadCheckpoints(): ChatCheckpointMap {
  try {
    const raw = localStorage.getItem(CHECKPOINTS_KEY)
    return raw ? (JSON.parse(raw) as ChatCheckpointMap) : {}
  } catch {
    return {}
  }
}

export function saveCheckpoints(map: ChatCheckpointMap) {
  localStorage.setItem(CHECKPOINTS_KEY, JSON.stringify(map))
}

export function getCheckpointDate(checkpoints: ChatCheckpointMap, chatName: string): Date | null {
  const fromStore = checkpoints[chatName]
  if (!fromStore) return null
  const d = new Date(fromStore)
  return Number.isNaN(d.getTime()) ? null : d
}
