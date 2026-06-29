import { LOG_FIELD_LABELS } from 'lib/system-log-labels'

const INTERNAL_OBJECT_KEYS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'key',
  'storageType',
  'materialId',
  'fileId',
  'sortOrder',
  'url',
  'mimeType',
  'size',
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatEntityLabel(obj: Record<string, unknown>): string | null {
  const code = obj.code
  const name = obj.name
  if (typeof code === 'string' && typeof name === 'string') return `${code} ${name}`
  if (typeof name === 'string') return name
  return null
}

export function formatLogDisplayValue(value: unknown, depth = 0): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? '启用' : '停用'
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  if (typeof value === 'string') {
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return formatLogDisplayValue(JSON.parse(value), depth)
      } catch {
        return value
      }
    }
    return value
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    return value
      .map((item) => {
        if (isPlainObject(item)) {
          if (isPlainObject(item.file) && typeof item.file.name === 'string') return item.file.name
          const entity = formatEntityLabel(item)
          if (entity) return entity
        }
        return formatLogDisplayValue(item, depth + 1)
      })
      .join('、')
  }
  if (isPlainObject(value)) {
    const entity = formatEntityLabel(value)
    if (entity) return entity
    if (typeof value.name === 'string' && ('mimeType' in value || 'size' in value)) {
      return value.name
    }
    if (depth < 2) {
      const parts = Object.entries(value)
        .filter(([key]) => !INTERNAL_OBJECT_KEYS.has(key))
        .map(([key, nested]) => {
          const label = LOG_FIELD_LABELS[key] ?? key
          return `${label}: ${formatLogDisplayValue(nested, depth + 1)}`
        })
      if (parts.length > 0) return parts.join('；')
    }
    return JSON.stringify(value)
  }
  return String(value)
}
