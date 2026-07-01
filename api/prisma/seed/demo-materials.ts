/** 演示基准：8万+件 / 40品种 / 两库四区 */
export const CENTER = {
  targetSpecies: 40,
  targetStock: 80_000,
}

export const MATERIAL_TEMPLATES: Array<{
  name: string
  spec: string
  unit: string
  zoneIdx: number
  shelfLife: number
  min: number
  max: number
}> = [
  { name: '救灾专用棉被', spec: '200×150cm', unit: '条', zoneIdx: 1, shelfLife: 60, min: 500, max: 5000 },
  { name: '12㎡应急帐篷', spec: '12㎡', unit: '顶', zoneIdx: 1, shelfLife: 84, min: 100, max: 1000 },
  { name: '折叠床', spec: '标准型', unit: '张', zoneIdx: 1, shelfLife: 120, min: 200, max: 2000 },
  { name: '应急照明灯', spec: 'LED', unit: '盏', zoneIdx: 1, shelfLife: 60, min: 300, max: 3000 },
  { name: '救生衣', spec: '成人', unit: '件', zoneIdx: 1, shelfLife: 84, min: 500, max: 5000 },
  { name: '防汛沙袋', spec: '50kg/袋', unit: '袋', zoneIdx: 0, shelfLife: 120, min: 2000, max: 20000 },
  { name: '抽水泵', spec: '10kW', unit: '台', zoneIdx: 0, shelfLife: 120, min: 20, max: 200 },
  { name: '橡皮艇', spec: '6人', unit: '艘', zoneIdx: 0, shelfLife: 84, min: 30, max: 300 },
  { name: '铁锹', spec: '标准', unit: '把', zoneIdx: 0, shelfLife: 120, min: 500, max: 5000 },
  { name: '发电机', spec: '5kW', unit: '台', zoneIdx: 0, shelfLife: 120, min: 15, max: 150 },
  { name: '医用口罩', spec: 'N95', unit: '只', zoneIdx: 2, shelfLife: 36, min: 10000, max: 100000 },
  { name: '医用手套', spec: '乳胶', unit: '双', zoneIdx: 2, shelfLife: 36, min: 5000, max: 50000 },
  { name: '消毒液', spec: '500ml', unit: '瓶', zoneIdx: 2, shelfLife: 24, min: 1000, max: 10000 },
  { name: '饮用水', spec: '550ml', unit: '箱', zoneIdx: 2, shelfLife: 12, min: 2000, max: 20000 },
  { name: '压缩饼干', spec: '900cal', unit: '盒', zoneIdx: 2, shelfLife: 24, min: 3000, max: 30000 },
  { name: '手电筒', spec: '强光', unit: '个', zoneIdx: 2, shelfLife: 60, min: 800, max: 8000 },
  { name: '雨衣', spec: '一次性', unit: '件', zoneIdx: 2, shelfLife: 60, min: 2000, max: 20000 },
  { name: '毛毯', spec: '150×200', unit: '条', zoneIdx: 2, shelfLife: 60, min: 1000, max: 10000 },
  { name: '急救包', spec: '标准', unit: '套', zoneIdx: 2, shelfLife: 36, min: 500, max: 5000 },
  { name: '防护服', spec: '连体', unit: '套', zoneIdx: 2, shelfLife: 36, min: 800, max: 8000 },
  { name: '常温药品箱', spec: '综合', unit: '箱', zoneIdx: 3, shelfLife: 24, min: 100, max: 1000 },
  { name: '疫苗冷藏箱', spec: '2-8℃', unit: '箱', zoneIdx: 3, shelfLife: 12, min: 50, max: 500 },
  { name: '血液制品', spec: '应急', unit: '单位', zoneIdx: 3, shelfLife: 6, min: 20, max: 200 },
  { name: '胰岛素', spec: '冷藏', unit: '支', zoneIdx: 3, shelfLife: 24, min: 200, max: 2000 },
  { name: '体温计', spec: '电子', unit: '支', zoneIdx: 3, shelfLife: 60, min: 300, max: 3000 },
  { name: '担架', spec: '折叠', unit: '副', zoneIdx: 1, shelfLife: 120, min: 100, max: 1000 },
  { name: '防潮垫', spec: '180×60', unit: '张', zoneIdx: 1, shelfLife: 84, min: 400, max: 4000 },
  { name: '编织袋', spec: '50kg', unit: '条', zoneIdx: 0, shelfLife: 120, min: 3000, max: 30000 },
  { name: '安全绳', spec: '20m', unit: '根', zoneIdx: 0, shelfLife: 84, min: 200, max: 2000 },
  { name: '警示带', spec: '100m', unit: '卷', zoneIdx: 0, shelfLife: 60, min: 500, max: 5000 },
  { name: '对讲机', spec: '防爆', unit: '台', zoneIdx: 2, shelfLife: 60, min: 100, max: 1000 },
  { name: '卫星电话', spec: '便携', unit: '部', zoneIdx: 2, shelfLife: 60, min: 10, max: 100 },
  { name: '移动电源', spec: '20000mAh', unit: '个', zoneIdx: 2, shelfLife: 36, min: 500, max: 5000 },
  { name: '暖宝宝', spec: '自发热', unit: '包', zoneIdx: 1, shelfLife: 36, min: 2000, max: 20000 },
  { name: '婴儿奶粉', spec: '应急', unit: '罐', zoneIdx: 1, shelfLife: 24, min: 200, max: 2000 },
  { name: '成人纸尿裤', spec: 'L码', unit: '包', zoneIdx: 1, shelfLife: 36, min: 500, max: 5000 },
  { name: '净水片', spec: '100片', unit: '瓶', zoneIdx: 2, shelfLife: 36, min: 800, max: 8000 },
  { name: '睡袋', spec: '-10℃', unit: '个', zoneIdx: 1, shelfLife: 84, min: 300, max: 3000 },
  { name: '工兵铲', spec: '多功能', unit: '把', zoneIdx: 0, shelfLife: 120, min: 400, max: 4000 },
  { name: '探照灯', spec: '1000W', unit: '盏', zoneIdx: 0, shelfLife: 60, min: 50, max: 500 },
]

export function addDays(d: Date, days: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

export function addMonths(d: Date, months: number) {
  const r = new Date(d)
  r.setMonth(r.getMonth() + months)
  return r
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatYMD(d: Date) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`
}

function formatYYMMDD(d: Date) {
  return `${String(d.getFullYear()).slice(2)}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`
}

/** 按库区/效期特征生成接近厂商习惯的批次号（确定性，可复现） */
function buildRealisticBatchNo(
  materialIdx: number,
  tpl: (typeof MATERIAL_TEMPLATES)[number],
  productionDate: Date,
  lotSeq: number,
): string {
  const ymd = formatYMD(productionDate)
  const yymmdd = formatYYMMDD(productionDate)
  const lot = String(lotSeq).padStart(3, '0')

  if (tpl.zoneIdx === 3 || tpl.shelfLife <= 12) {
    return `${yymmdd}${lot}`
  }
  if (tpl.zoneIdx === 2 && tpl.shelfLife <= 36) {
    return `${ymd}-${String.fromCharCode(65 + (materialIdx + lotSeq) % 3)}`
  }
  if (tpl.zoneIdx === 0) {
    return `WH${yymmdd}-${pad2(lotSeq)}`
  }
  return `SC${yymmdd}${String.fromCharCode(65 + (lotSeq % 3))}`
}

type BatchPlan = {
  batchNo: string
  productionDate: Date
  expiryDate: Date
  qtyShare: number
}

/** 同一物资可有多批次（效期错落、数量分摊），用于 FIFO / 临期预警演示 */
export function buildBatchPlans(materialIdx: number, tpl: (typeof MATERIAL_TEMPLATES)[number], now: Date): BatchPlan[] {
  const expiryProfile = materialIdx % 10

  const single = (expiryDate: Date, lotSeq = 1, qtyShare = 1): BatchPlan[] => {
    const productionDate = addDays(addMonths(expiryDate, -tpl.shelfLife), -((materialIdx * 5 + lotSeq * 11) % 28))
    return [{
      batchNo: buildRealisticBatchNo(materialIdx, tpl, productionDate, lotSeq),
      productionDate,
      expiryDate,
      qtyShare,
    }]
  }

  if (materialIdx === 0) {
    return [
      ...single(addDays(now, 15), 1, 0.18),
      ...single(addMonths(now, tpl.shelfLife - 2), 2, 0.82),
    ]
  }
  if (materialIdx === 1) {
    return [
      ...single(addDays(now, 45 + materialIdx), 1, 0.25),
      ...single(addMonths(now, tpl.shelfLife - 1), 2, 0.75),
    ]
  }
  if (materialIdx === 10) {
    return [
      ...single(addDays(now, 72), 1, 0.15),
      ...single(addMonths(now, tpl.shelfLife - 6), 2, 0.35),
      ...single(addMonths(now, tpl.shelfLife - 1), 3, 0.5),
    ]
  }
  if (materialIdx === 22) {
    return single(addDays(now, 18), 1)
  }

  if (expiryProfile === 0) return single(addDays(now, 15))
  if (expiryProfile === 1 || expiryProfile === 2) return single(addDays(now, 45 + materialIdx * 3))
  return single(addMonths(now, tpl.shelfLife))
}
