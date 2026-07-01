import { translate } from 'locales'

export type MovementTypeId = 'INBOUND' | 'OUTBOUND' | 'SPLIT' | 'TRANSFER' | 'ADJUST' | 'SCRAP'

export const MOVEMENT_TYPE_LABELS: Record<MovementTypeId, string> = {
  INBOUND: '入库',
  OUTBOUND: '出库',
  SPLIT: '拆零',
  TRANSFER: '移库',
  ADJUST: '调整',
  SCRAP: '报废',
}

export const MOVEMENT_TYPE_FILTERS = ['all', 'INBOUND', 'OUTBOUND', 'SPLIT', 'TRANSFER', 'ADJUST', 'SCRAP'] as const

export type MovementTypeConfig = {
  label: string
  dotClass: string
  badgeClass: string
  filterActiveClass: string
}

const MOVEMENT_CONFIG: Record<MovementTypeId, MovementTypeConfig> = {
  INBOUND: {
    label: '入库',
    dotClass: 'bg-emerald-500',
    badgeClass: 'border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300',
    filterActiveClass: 'ring-emerald-400/35',
  },
  OUTBOUND: {
    label: '出库',
    dotClass: 'bg-amber-500',
    badgeClass: 'border-amber-200/90 bg-amber-50 text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300',
    filterActiveClass: 'ring-amber-400/35',
  },
  SPLIT: {
    label: '拆零',
    dotClass: 'bg-indigo-500',
    badgeClass: 'border-indigo-200/90 bg-indigo-50 text-indigo-900 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300',
    filterActiveClass: 'ring-indigo-400/35',
  },
  TRANSFER: {
    label: '移库',
    dotClass: 'bg-sky-500',
    badgeClass: 'border-sky-200/90 bg-sky-50 text-sky-900 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300',
    filterActiveClass: 'ring-sky-400/35',
  },
  ADJUST: {
    label: '调整',
    dotClass: 'bg-violet-500',
    badgeClass: 'border-violet-200/90 bg-violet-50 text-violet-900 dark:border-violet-800/80 dark:bg-violet-950/40 dark:text-violet-300',
    filterActiveClass: 'ring-violet-400/35',
  },
  SCRAP: {
    label: '报废',
    dotClass: 'bg-red-500',
    badgeClass: 'border-red-200/90 bg-red-50 text-red-900 dark:border-red-800/80 dark:bg-red-950/40 dark:text-red-300',
    filterActiveClass: 'ring-red-400/35',
  },
}

export function getMovementTypeConfig(type: string): MovementTypeConfig {
  const base = MOVEMENT_CONFIG[type as MovementTypeId] ?? {
    label: type,
    dotClass: 'bg-muted-foreground/55',
    badgeClass: 'border-border/70 bg-muted/40 text-muted-foreground',
    filterActiveClass: 'ring-muted-foreground/25',
  }
  return { ...base, label: translate(base.label) }
}

export function formatQtyChange(before: unknown, after: unknown, qty: unknown): string {
  const q = Number(qty)
  const b = before != null ? Number(before) : null
  const a = after != null ? Number(after) : null
  if (b != null && a != null && b !== a) return `${b} → ${a}`
  return String(q)
}
