import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { translate } from 'locales'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const INBOUND_TYPE_LABELS: Record<string, string> = {
  PURCHASE: '采购入库',
  TRANSFER: '调拨入库',
  RETURN: '退库入库',
}

import { ORDER_STATUS } from 'lib/order-status'

export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label]),
)

export const ZONE_LABELS: Record<string, string> = {
  RESCUE: '救助类',
  DISASTER: '抢险类',
  GENERAL: '通用类',
  TEMPERATURE: '恒温库',
}

/** 库内存储分区 A/B/C/D（两库四区方案） */
export { STORAGE_ZONE_LABELS } from 'lib/warehouse-layout'

export const ALERT_LEVEL: Record<string, { label: string; color: string }> = {
  GREEN: { label: '安全', color: 'bg-emerald-500' },
  YELLOW: { label: '临期', color: 'bg-amber-400' },
  RED: { label: '预警', color: 'bg-red-500' },
}

export function getInboundTypeLabel(type: string): string {
  return translate(INBOUND_TYPE_LABELS[type] ?? type)
}

export function getZoneLabel(zone: string): string {
  return translate(ZONE_LABELS[zone] ?? zone)
}

export function getAlertLevelLabel(level: string): string {
  const item = ALERT_LEVEL[level]
  return item ? translate(item.label) : level
}

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('zh-CN')
}

export function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(n: number) {
  return n.toLocaleString('zh-CN')
}

export function statusBadgeVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
    COMPLETED: 'success',
    SHIPPED: 'success',
    PENDING: 'warning',
    RECEIVING: 'info',
    PICKING: 'info',
    APPROVED: 'info',
    REJECTED: 'destructive',
    CANCELLED: 'destructive',
    IN_STOCK: 'success',
  }
  return map[s] ?? 'secondary'
}
