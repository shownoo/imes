/**
 * IMES 应急物资库房布局 — 行业标准「两库四区」
 *
 * - 物理库房（Warehouse）：中心主库 + 战略备库
 * - 存储分区（Shelf.zone A/B/C/D）：库内功能分区，对应物资大类
 * - 货位（Shelf）：扫码上架最小定位单元
 */
export const WAREHOUSE_PLAN = [
  {
    code: 'WH-MAIN',
    name: '中心主库',
    zoneType: 'GENERAL' as const,
    area: 35_000,
    capacity: 315_000,
    remark: '日常收发 · 抢险/救助/通用物资',
  },
  {
    code: 'WH-BACKUP',
    name: '战略备库',
    zoneType: 'TEMPERATURE' as const,
    area: 5_000,
    capacity: 35_000,
    remark: '恒温冷链 · 战略储备 · 跨库调拨',
  },
] as const

export const STORAGE_ZONE_PLAN = [
  {
    code: 'A',
    warehouseCode: 'WH-MAIN',
    name: 'A区·抢险类',
    zoneType: 'DISASTER' as const,
    area: 12_000,
    capacity: 105_000,
    stockShare: 0.28,
  },
  {
    code: 'B',
    warehouseCode: 'WH-MAIN',
    name: 'B区·救助类',
    zoneType: 'RESCUE' as const,
    area: 15_000,
    capacity: 140_000,
    stockShare: 0.32,
  },
  {
    code: 'C',
    warehouseCode: 'WH-MAIN',
    name: 'C区·通用类',
    zoneType: 'GENERAL' as const,
    area: 8_000,
    capacity: 70_000,
    stockShare: 0.25,
  },
  {
    code: 'D',
    warehouseCode: 'WH-BACKUP',
    name: 'D区·恒温库',
    zoneType: 'TEMPERATURE' as const,
    area: 5_000,
    capacity: 35_000,
    stockShare: 0.15,
  },
] as const

export const STORAGE_ZONE_LABELS: Record<string, string> = Object.fromEntries(
  STORAGE_ZONE_PLAN.map((z) => [z.code, z.name]),
)

export function warehouseCodeForMaterialZone(zoneIdx: number): string {
  const zone = STORAGE_ZONE_PLAN[zoneIdx] ?? STORAGE_ZONE_PLAN[2]
  return zone.warehouseCode
}

export function storageZoneCapacity(zoneCode: string): number {
  return STORAGE_ZONE_PLAN.find((z) => z.code === zoneCode)?.capacity ?? 0
}
