/** 出库用途 — 系统运行必需的字典项 */
export const REQUIRED_OUTBOUND_PURPOSES = [
  { code: 'FLOOD_RELIEF', name: '防汛抢险', sortOrder: 20 },
  { code: 'DISASTER_ALLOC', name: '救灾调拨', sortOrder: 30 },
  { code: 'EPIDEMIC_PREVENT', name: '防疫物资', sortOrder: 40 },
  { code: 'WINTER_WARM', name: '冬季防寒', sortOrder: 50 },
  { code: 'DRILL', name: '应急演练', sortOrder: 60 },
  { code: 'EXPIRY_FIRST', name: '临期优先出库', sortOrder: 70 },
  { code: 'TRANSFER', name: '调拨申请', sortOrder: 110 },
] as const

/** 出库用途 — 仅演示场景使用的字典项 */
export const DEMO_OUTBOUND_PURPOSES = [
  { code: 'DRAFT_TRANSFER', name: '草稿调拨', sortOrder: 10 },
  { code: 'PICK_DEMO', name: '部分拣货演示', sortOrder: 80 },
  { code: 'SHIPPED_DEMO', name: '已完成拣货待结案', sortOrder: 90 },
  { code: 'HISTORY_REF', name: '历史出库参考', sortOrder: 100 },
] as const

/** 出库目的地 — 武汉市各区应急保障局（基础字典） */
export const OUTBOUND_DESTINATIONS = [
  { code: 'JIANAN', city: '武汉市', district: '江岸区', name: '江岸区应急保障局', sortOrder: 10 },
  { code: 'JIANGHAN', city: '武汉市', district: '江汉区', name: '江汉区应急保障局', sortOrder: 20 },
  { code: 'QIAOKOU', city: '武汉市', district: '硚口区', name: '硚口区应急保障局', sortOrder: 30 },
  { code: 'HANYANG', city: '武汉市', district: '汉阳区', name: '汉阳区应急保障局', sortOrder: 40 },
  { code: 'WUCHANG', city: '武汉市', district: '武昌区', name: '武昌区应急保障局', sortOrder: 50 },
  { code: 'QINGSHAN', city: '武汉市', district: '青山区', name: '青山区应急保障局', sortOrder: 60 },
  { code: 'HONGSHAN', city: '武汉市', district: '洪山区', name: '洪山区应急保障局', sortOrder: 70 },
  { code: 'DONGXIHU', city: '武汉市', district: '东西湖区', name: '东西湖区应急保障局', sortOrder: 80 },
  { code: 'HANNAN', city: '武汉市', district: '汉南区', name: '汉南区应急保障局', sortOrder: 90 },
  { code: 'CAIDIAN', city: '武汉市', district: '蔡甸区', name: '蔡甸区应急保障局', sortOrder: 100 },
  { code: 'JIANGXIA', city: '武汉市', district: '江夏区', name: '江夏区应急保障局', sortOrder: 110 },
  { code: 'HUANGPI', city: '武汉市', district: '黄陂区', name: '黄陂区应急保障局', sortOrder: 120 },
  { code: 'XINZHOU', city: '武汉市', district: '新洲区', name: '新洲区应急保障局', sortOrder: 130 },
] as const
