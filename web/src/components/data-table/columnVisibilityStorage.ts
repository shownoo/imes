import type { VisibilityState } from '@tanstack/react-table'

const STORAGE_VERSION = 'v1'
const STORAGE_PREFIX = 'imes:table-col-visibility'

export function buildVisibilityStorageKey(userId: string, tableKey: string): string {
  return `${STORAGE_PREFIX}:${STORAGE_VERSION}:${userId}:${tableKey}`
}

export function readColumnVisibility(
  userId: string,
  tableKey: string,
): VisibilityState | null {
  try {
    const raw = localStorage.getItem(buildVisibilityStorageKey(userId, tableKey))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    const result: VisibilityState = {}
    for (const [id, visible] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof visible === 'boolean') result[id] = visible
    }
    return result
  } catch {
    return null
  }
}

export function writeColumnVisibility(
  userId: string,
  tableKey: string,
  visibility: VisibilityState,
): void {
  try {
    localStorage.setItem(
      buildVisibilityStorageKey(userId, tableKey),
      JSON.stringify(visibility),
    )
  } catch {
    // ignore quota / private-mode errors
  }
}

export function mergeVisibility(
  saved: VisibilityState | null | undefined,
  defaultVisibility: VisibilityState,
  currentColumnIds: string[],
): VisibilityState {
  const currentSet = new Set(currentColumnIds)
  const merged: VisibilityState = {}

  for (const id of currentColumnIds) {
    if (id in defaultVisibility) {
      merged[id] = defaultVisibility[id]!
    } else {
      merged[id] = true
    }
  }

  if (saved) {
    for (const [id, visible] of Object.entries(saved)) {
      if (currentSet.has(id) && typeof visible === 'boolean') {
        merged[id] = visible
      }
    }
  }

  return merged
}
