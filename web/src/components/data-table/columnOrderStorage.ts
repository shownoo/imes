const STORAGE_VERSION = 'v1'
const STORAGE_PREFIX = 'imes:table-col-order'

export type ColumnZone = 'selection' | 'left' | 'middle' | 'right'

export type ColumnFixedMeta = 'left' | 'right' | boolean | undefined

export interface ColumnOrderMeta {
  id: string
  fixed?: ColumnFixedMeta
}

export function buildOrderStorageKey(userId: string, tableKey: string): string {
  return `${STORAGE_PREFIX}:${STORAGE_VERSION}:${userId}:${tableKey}`
}

export function getColumnZone(columnId: string, fixed?: ColumnFixedMeta): ColumnZone {
  if (columnId === '_selection') return 'selection'
  if (fixed === 'right') return 'right'
  if (fixed === 'left' || fixed === true) return 'left'
  return 'middle'
}

export function readColumnOrder(userId: string, tableKey: string): string[] | null {
  try {
    const raw = localStorage.getItem(buildOrderStorageKey(userId, tableKey))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return null
  }
}

export function writeColumnOrder(userId: string, tableKey: string, order: string[]): void {
  try {
    localStorage.setItem(buildOrderStorageKey(userId, tableKey), JSON.stringify(order))
  } catch {
    // ignore quota / private-mode errors
  }
}

function partitionByZone(
  ids: string[],
  metaById: Map<string, ColumnOrderMeta>,
): Record<ColumnZone, string[]> {
  const zones: Record<ColumnZone, string[]> = {
    selection: [],
    left: [],
    middle: [],
    right: [],
  }
  for (const id of ids) {
    const zone = getColumnZone(id, metaById.get(id)?.fixed)
    zones[zone].push(id)
  }
  return zones
}

export function mergeOrder(
  saved: string[] | null | undefined,
  defaultOrder: string[],
  currentColumnIds: string[],
  columnMetas: ColumnOrderMeta[],
): string[] {
  const currentSet = new Set(currentColumnIds)
  const metaById = new Map(columnMetas.map((m) => [m.id, m]))

  const defaultFiltered = defaultOrder.filter((id) => currentSet.has(id))
  const defaultZones = partitionByZone(defaultFiltered, metaById)

  const savedFiltered = (saved ?? []).filter((id) => currentSet.has(id))
  const savedZones = partitionByZone(savedFiltered, metaById)

  const middleSet = new Set(defaultZones.middle)
  const orderedMiddle: string[] = []
  for (const id of savedZones.middle) {
    if (middleSet.has(id) && !orderedMiddle.includes(id)) {
      orderedMiddle.push(id)
    }
  }
  for (const id of defaultZones.middle) {
    if (!orderedMiddle.includes(id)) orderedMiddle.push(id)
  }

  return [
    ...defaultZones.selection,
    ...defaultZones.left,
    ...orderedMiddle,
    ...defaultZones.right,
  ]
}

export function reorderMiddleColumns(
  currentOrder: string[],
  fromIndex: number,
  toIndex: number,
  columnMetas: ColumnOrderMeta[],
): string[] {
  const metaById = new Map(columnMetas.map((m) => [m.id, m]))
  const zones = partitionByZone(currentOrder, metaById)
  const middle = [...zones.middle]
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= middle.length ||
    toIndex >= middle.length ||
    fromIndex === toIndex
  ) {
    return currentOrder
  }
  const [moved] = middle.splice(fromIndex, 1)
  middle.splice(toIndex, 0, moved)
  return [...zones.selection, ...zones.left, ...middle, ...zones.right]
}
