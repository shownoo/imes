import { translate } from 'locales'
/** 与 api/src/lib/warehouse-layout.ts 保持一致 — 前端展示 / 默认收货库推断 */
export const WAREHOUSE_PLAN = [
  { code: 'WH-MAIN', name: translate('中心主库') },
  { code: 'WH-BACKUP', name: translate('战略备库') },
] as const

export const STORAGE_ZONE_PLAN = [
  { code: 'A', warehouseCode: 'WH-MAIN', name: translate('A区·抢险类'), zoneType: 'DISASTER' },
  { code: 'B', warehouseCode: 'WH-MAIN', name: translate('B区·救助类'), zoneType: 'RESCUE' },
  { code: 'C', warehouseCode: 'WH-MAIN', name: translate('C区·通用类'), zoneType: 'GENERAL' },
  { code: 'D', warehouseCode: 'WH-BACKUP', name: translate('D区·恒温库'), zoneType: 'TEMPERATURE' },
] as const

export const STORAGE_ZONE_LABELS: Record<string, string> = Object.fromEntries(
  STORAGE_ZONE_PLAN.map((z) => [z.code, z.name]),
)

const ZONE_TYPE_TO_IDX: Record<string, number> = {
  DISASTER: 0,
  RESCUE: 1,
  GENERAL: 2,
  TEMPERATURE: 3,
}

/** 按物资大类推断默认收货仓库 code */
export function warehouseCodeForCategoryZone(zoneType?: string | null): string {
  const idx = ZONE_TYPE_TO_IDX[zoneType ?? 'GENERAL'] ?? 2
  return STORAGE_ZONE_PLAN[idx]?.warehouseCode ?? 'WH-MAIN'
}
