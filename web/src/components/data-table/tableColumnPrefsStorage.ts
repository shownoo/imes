import type { VisibilityState } from '@tanstack/react-table'

import { buildOrderStorageKey, readColumnOrder } from './columnOrderStorage'
import { buildStorageKey as buildSizingStorageKey, readColumnSizes } from './columnSizingStorage'
import { buildVisibilityStorageKey, readColumnVisibility } from './columnVisibilityStorage'

const STORAGE_VERSION = 'v2'
const STORAGE_PREFIX = 'imes:table-prefs'

export interface TableColumnPrefsSettings {
  order?: string[]
  visibility?: VisibilityState
  sizing?: Record<string, number>
}

export interface TableColumnPrefsPayload {
  settings: TableColumnPrefsSettings
  version: number
  updatedAt: string
}

export function buildTablePrefsStorageKey(userId: string, tableKey: string): string {
  return `${STORAGE_PREFIX}:${STORAGE_VERSION}:${userId}:${tableKey}`
}

function isVisibilityState(value: unknown): value is VisibilityState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value).every((v) => typeof v === 'boolean')
}

function isSizingRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.entries(value).every(([, v]) => typeof v === 'number' && Number.isFinite(v))
}

function parsePayload(raw: string): TableColumnPrefsPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    const record = parsed as Record<string, unknown>
    const settings = record.settings
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return null
    }
    const settingsRecord = settings as TableColumnPrefsSettings
    if (
      settingsRecord.order != null &&
      (!Array.isArray(settingsRecord.order) ||
        !settingsRecord.order.every((id) => typeof id === 'string'))
    ) {
      return null
    }
    if (settingsRecord.visibility != null && !isVisibilityState(settingsRecord.visibility)) {
      return null
    }
    if (settingsRecord.sizing != null && !isSizingRecord(settingsRecord.sizing)) {
      return null
    }
    const version =
      typeof record.version === 'number' && Number.isFinite(record.version)
        ? record.version
        : 1
    const updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt : ''
    return { settings: settingsRecord, version, updatedAt }
  } catch {
    return null
  }
}

export function migrateV1ToSettings(
  userId: string,
  tableKey: string,
): TableColumnPrefsSettings | null {
  const order = readColumnOrder(userId, tableKey)
  const visibility = readColumnVisibility(userId, tableKey)
  const sizing = readColumnSizes(userId, tableKey)
  if (!order && !visibility && !sizing) return null

  const settings: TableColumnPrefsSettings = {}
  if (order) settings.order = order
  if (visibility) settings.visibility = visibility
  if (sizing) settings.sizing = sizing
  return settings
}

export function readTableColumnPrefs(
  userId: string,
  tableKey: string,
): TableColumnPrefsPayload | null {
  try {
    const raw = localStorage.getItem(buildTablePrefsStorageKey(userId, tableKey))
    if (raw) {
      const payload = parsePayload(raw)
      if (payload) return payload
    }
    const migrated = migrateV1ToSettings(userId, tableKey)
    if (!migrated) return null
    return { settings: migrated, version: 1, updatedAt: '' }
  } catch {
    return null
  }
}

export function writeTableColumnPrefs(
  userId: string,
  tableKey: string,
  partial: Partial<TableColumnPrefsSettings>,
  existing?: TableColumnPrefsPayload | null,
): TableColumnPrefsPayload {
  const base = existing ?? readTableColumnPrefs(userId, tableKey)
  const settings: TableColumnPrefsSettings = {
    ...(base?.settings ?? {}),
    ...partial,
  }
  const payload: TableColumnPrefsPayload = {
    settings,
    version: (base?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(
      buildTablePrefsStorageKey(userId, tableKey),
      JSON.stringify(payload),
    )
  } catch {
    // ignore quota / private-mode errors
  }
  return payload
}

export function clearTableColumnPrefs(userId: string, tableKey: string): void {
  try {
    localStorage.removeItem(buildTablePrefsStorageKey(userId, tableKey))
    localStorage.removeItem(buildOrderStorageKey(userId, tableKey))
    localStorage.removeItem(buildVisibilityStorageKey(userId, tableKey))
    localStorage.removeItem(buildSizingStorageKey(userId, tableKey))
  } catch {
    // ignore
  }
}
