/** Min/max pixel width for resizable table columns. */
export const COLUMN_SIZE_MIN = 32
export const COLUMN_SIZE_MAX = 600

export function resolveColumnMinSize(declaredWidth?: number): number {
  if (declaredWidth != null && Number.isFinite(declaredWidth)) {
    return Math.min(COLUMN_SIZE_MIN, declaredWidth)
  }
  return COLUMN_SIZE_MIN
}

const STORAGE_VERSION = 'v1'
const STORAGE_PREFIX = 'imes:table-col-widths'

export function buildStorageKey(userId: string, tableKey: string): string {
  return `${STORAGE_PREFIX}:${STORAGE_VERSION}:${userId}:${tableKey}`
}

export function clampColumnSize(size: number): number {
  return Math.min(COLUMN_SIZE_MAX, Math.max(COLUMN_SIZE_MIN, size))
}

export function readColumnSizes(
  userId: string,
  tableKey: string,
): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(buildStorageKey(userId, tableKey))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    const result: Record<string, number> = {}
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        result[id] = clampColumnSize(value)
      }
    }
    return result
  } catch {
    return null
  }
}

export function writeColumnSizes(
  userId: string,
  tableKey: string,
  sizes: Record<string, number>,
): void {
  try {
    localStorage.setItem(buildStorageKey(userId, tableKey), JSON.stringify(sizes))
  } catch {
    // ignore quota / private-mode errors
  }
}

export function mergeColumnSizes(
  defaults: Record<string, number>,
  saved: Record<string, number> | null | undefined,
  currentColumnIds: string[],
): Record<string, number> {
  const merged: Record<string, number> = {}
  for (const id of currentColumnIds) {
    const raw = saved?.[id] ?? defaults[id]
    if (raw != null && Number.isFinite(raw)) {
      merged[id] = clampColumnSize(raw)
    }
  }
  return merged
}
