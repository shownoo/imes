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
  /** 展示态：RECEIVING 且全部收齐，库表仍为 RECEIVING */
  INBOUND_READY_TO_COMPLETE: cfg('待入库', 'amber'),
  APPROVED: cfg('已审核', 'cyan'),
  PICKING: cfg('拣货中', 'indigo'),
  /** 展示态：PICKING 且全部拣齐，库表仍为 PICKING */
  OUTBOUND_READY_TO_SHIP: cfg('待出库', 'amber'),
  SHIPPED: cfg('已出库', 'teal'),
  COMPLETED: cfg('已完成', 'green'),
  CANCELLED: cfg('已取消', 'red'),
  REJECTED: cfg('已驳回', 'red'),
  /** 仓管作业：已审核 + 拣货中 */
  active: cfg('待作业', 'cyan'),
  IN_STOCK: cfg('在库', 'green'),
  IN_TRANSIT: cfg('在途', 'blue'),
  ISSUED: cfg('已发出', 'teal'),
  SCRAPPED: cfg('已报废', 'neutral'),
}

export function getStatusConfig(status: string): StatusConfig {
  const base = ORDER_STATUS[status] ?? cfg(status, 'neutral')
  return { ...base, label: translate(base.label) }
}

/** 出库流程步骤 */
export const OUTBOUND_PROCESS_STEPS = [
  { label: '新建申请', tip: '填写用途、领用人与物资明细，保存草稿后可提交审核' },
  { label: '主管审核', tip: '提交后进入审批流，审核通过后方可开始拣货' },
  { label: 'FIFO拣货', tip: '按效期优先推荐拣货路径，扫码逐件确认出库数量' },
  { label: '拆零赋码', tip: '整包出库时可拆分剩余库存，并生成新的二维码标签' },
  { label: '确认出库', tip: '全部拣齐后确认出库，库存正式扣减，单据变为已出库' },
  { label: '结案归档', tip: '发运复核无误后完成出库，单据归档结案' },
] as const

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

/** 采购入库流程步骤 */
export const INBOUND_PROCESS_STEPS = [
  { label: '选单清点', tip: '创建入库单并核对到货物资与采购明细' },
  { label: '补充批次效期', tip: '录入生产批次与保质期，支撑 FIFO 拣货' },
  { label: '蓝牙批量赋码', tip: '连接蓝牙打印机，批量生成并粘贴物资二维码' },
  { label: '扫码上架绑定', tip: '扫描货位码完成上架，建立物资与货位关联' },
] as const

export function getOutboundProcessSteps() {
  return OUTBOUND_PROCESS_STEPS.map((s) => ({
    label: translate(s.label),
    tip: translate(s.tip),
  }))
}

export function getInboundProcessSteps() {
  return INBOUND_PROCESS_STEPS.map((s) => ({
    label: translate(s.label),
    tip: translate(s.tip),
  }))
}
