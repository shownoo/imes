import { translate } from 'locales'

/** 单据 / 库存状态 — 语义色 + 筛选配置 */

export type OrderStatusId =
  | 'DRAFT'
  | 'PENDING'
  | 'RECEIVING'
  | 'APPROVED'
  | 'PICKING'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'IN_STOCK'
  | 'IN_TRANSIT'
  | 'ISSUED'
  | 'SCRAPPED'

export type StatusTone = 'neutral' | 'amber' | 'blue' | 'cyan' | 'indigo' | 'teal' | 'green' | 'red'

export type StatusConfig = {
  label: string
  tone: StatusTone
  /** 圆点 */
  dotClass: string
  /** 标签容器 */
  badgeClass: string
  /** 筛选 pill 选中态强调 */
  filterActiveClass: string
}

const TONE = {
  neutral: {
    dot: 'bg-muted-foreground/55',
    badge:
      'border-border/70 bg-muted/40 text-muted-foreground dark:bg-muted/30',
    filter: 'ring-muted-foreground/25',
  },
  amber: {
    dot: 'bg-amber-500',
    badge:
      'border-amber-200/90 bg-amber-50 text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300',
    filter: 'ring-amber-400/35',
  },
  blue: {
    dot: 'bg-sky-500',
    badge:
      'border-sky-200/90 bg-sky-50 text-sky-900 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300',
    filter: 'ring-sky-400/35',
  },
  cyan: {
    dot: 'bg-cyan-500',
    badge:
      'border-cyan-200/90 bg-cyan-50 text-cyan-900 dark:border-cyan-800/80 dark:bg-cyan-950/40 dark:text-cyan-300',
    filter: 'ring-cyan-400/35',
  },
  indigo: {
    dot: 'bg-indigo-500',
    badge:
      'border-indigo-200/90 bg-indigo-50 text-indigo-900 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300',
    filter: 'ring-indigo-400/35',
  },
  teal: {
    dot: 'bg-teal-500',
    badge:
      'border-teal-200/90 bg-teal-50 text-teal-900 dark:border-teal-800/80 dark:bg-teal-950/40 dark:text-teal-300',
    filter: 'ring-teal-400/35',
  },
  green: {
    dot: 'bg-emerald-500',
    badge:
      'border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300',
    filter: 'ring-emerald-400/35',
  },
  red: {
    dot: 'bg-red-500',
    badge:
      'border-red-200/90 bg-red-50 text-red-900 dark:border-red-800/80 dark:bg-red-950/40 dark:text-red-300',
    filter: 'ring-red-400/35',
  },
} satisfies Record<StatusTone, { dot: string; badge: string; filter: string }>

function cfg(label: string, tone: StatusTone): StatusConfig {
  const t = TONE[tone]
  return { label, tone, dotClass: t.dot, badgeClass: t.badge, filterActiveClass: t.filter }
}

export const ORDER_STATUS: Record<string, StatusConfig> = {
  DRAFT: cfg('草稿', 'neutral'),
  PENDING: cfg('待审核', 'amber'),
  RECEIVING: cfg('收货中', 'blue'),
  APPROVED: cfg('已审核', 'cyan'),
  PICKING: cfg('拣货中', 'indigo'),
  SHIPPED: cfg('已出库', 'teal'),
  COMPLETED: cfg('已完成', 'green'),
  CANCELLED: cfg('已取消', 'red'),
  REJECTED: cfg('已驳回', 'red'),
  IN_STOCK: cfg('在库', 'green'),
  IN_TRANSIT: cfg('在途', 'blue'),
  ISSUED: cfg('已发出', 'teal'),
  SCRAPPED: cfg('已报废', 'neutral'),
}

export function getStatusConfig(status: string): StatusConfig {
  const base = ORDER_STATUS[status] ?? cfg(status, 'neutral')
  return { ...base, label: translate(base.label) }
}

/** 出库单筛选顺序（工作流） */
export const OUTBOUND_STATUS_FILTERS = [
  'all',
  'DRAFT',
  'PENDING',
  'APPROVED',
  'PICKING',
  'SHIPPED',
  'COMPLETED',
  'REJECTED',
] as const

/** 入库单筛选顺序 */
export const INBOUND_STATUS_FILTERS = [
  'all',
  'DRAFT',
  'PENDING',
  'RECEIVING',
  'COMPLETED',
  'CANCELLED',
] as const
