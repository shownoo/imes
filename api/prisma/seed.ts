import bcrypt from 'bcryptjs'
import { PrismaClient, type Prisma } from '@prisma/client'
import { buildChangeDetail } from '../src/lib/log-diff.js'
import { genQrCode } from '../src/lib/utils.js'
import { seedRbac } from './rbac-seed.js'
import { seedApprovalFlows } from './approval-seed.js'
import { seedPrintTemplates } from '../scripts/lib/seed-print-templates.js'
import { DEFAULT_NOTIFY_CONFIG } from '../src/lib/approval-types.js'
import {
  STORAGE_ZONE_PLAN,
  WAREHOUSE_PLAN,
  warehouseCodeForMaterialZone,
} from '../src/lib/warehouse-layout.js'

const prisma = new PrismaClient()

/** 演示基准：8万+件 / 40品种 / 两库四区 */
const CENTER = {
  targetSpecies: 40,
  targetStock: 80_000,
}


const MATERIAL_TEMPLATES: Array<{ name: string; spec: string; unit: string; zoneIdx: number; shelfLife: number; min: number; max: number }> = [
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

function addDays(d: Date, days: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

function addMonths(d: Date, months: number) {
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
function buildBatchPlans(materialIdx: number, tpl: (typeof MATERIAL_TEMPLATES)[number], now: Date): BatchPlan[] {
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

function seedLogDetail(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  options?: { fields?: string[]; labels?: Record<string, string> },
): Prisma.InputJsonValue {
  return buildChangeDetail(before, after, options) as Prisma.InputJsonValue
}

async function resetDemoData() {
  await prisma.approvalTask.deleteMany()
  await prisma.approvalInstance.deleteMany()
  await prisma.systemLog.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.outboundOrderLine.deleteMany()
  await prisma.outboundOrder.deleteMany()
  await prisma.inboundOrderLine.deleteMany()
  await prisma.inboundOrder.deleteMany()
  await prisma.stockItem.deleteMany()
  await prisma.materialBatch.deleteMany()
  await prisma.material.deleteMany()
  await prisma.materialCategory.deleteMany()
  await prisma.shelf.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.supplier.deleteMany()
}

async function main() {
  const password = await bcrypt.hash('123456', 10)
  const roles = await seedRbac(prisma)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { roleId: roles.ADMIN },
    create: { username: 'admin', password, name: '系统管理员', roleId: roles.ADMIN },
  })
  await prisma.user.upsert({
    where: { username: 'supervisor' },
    update: { roleId: roles.SUPERVISOR },
    create: { username: 'supervisor', password, name: '仓储主管', roleId: roles.SUPERVISOR },
  })
  await prisma.user.upsert({
    where: { username: 'keeper' },
    update: { roleId: roles.WAREHOUSE_KEEPER },
    create: { username: 'keeper', password, name: '仓管员', roleId: roles.WAREHOUSE_KEEPER },
  })
  await prisma.user.upsert({
    where: { username: 'viewer' },
    update: { roleId: roles.VIEWER },
    create: { username: 'viewer', password, name: '只读访客', roleId: roles.VIEWER },
  })

  await seedApprovalFlows()
  await prisma.systemSetting.upsert({
    where: { key: 'approval_notify' },
    create: { key: 'approval_notify', value: DEFAULT_NOTIFY_CONFIG as never },
    update: {},
  })
  await resetDemoData()

  const supplier = await prisma.supplier.create({
    data: {
      code: 'SUP-001',
      name: '华中应急物资供应有限公司',
      contact: '张经理',
      phone: '027-88886666',
      address: '武汉市洪山区青菱街建阳一路90号',
      license: '鄂应急供字2024001',
    },
  })

  const warehouses = []
  const warehouseByCode = new Map<string, { id: string; code: string; name: string }>()
  for (const wh of WAREHOUSE_PLAN) {
    const row = await prisma.warehouse.create({
      data: { code: wh.code, name: wh.name, zone: wh.zoneType, area: wh.area, capacity: wh.capacity },
    })
    warehouses.push(row)
    warehouseByCode.set(wh.code, row)
  }

  const shelves: Array<{ id: string; code: string; zone: string; warehouseId: string }> = []
  for (const z of STORAGE_ZONE_PLAN) {
    const wh = warehouseByCode.get(z.warehouseCode)!
    for (let row = 1; row <= 4; row++) {
      for (let level = 1; level <= 4; level++) {
        const code = `${z.code}-${String(row).padStart(2, '0')}-${level}`
        const shelf = await prisma.shelf.create({
          data: {
            code,
            name: `${z.name} ${row}排${level}层`,
            zone: z.code,
            row: String(row),
            level,
            capacity: 800,
            warehouseId: wh.id,
            qrCode: `SHELF-${code}`,
          },
        })
        shelves.push(shelf)
      }
    }
  }

  const categories = []
  for (const z of STORAGE_ZONE_PLAN) {
    const cat = await prisma.materialCategory.create({
      data: {
        code: `MT-${z.code}`,
        name: z.name,
        zone: z.zoneType,
        shelfLifeMonths: z.zoneType === 'TEMPERATURE' ? 24 : 60,
        safetyStockMin: 1000,
        safetyStockMax: 50000,
      },
    })
    categories.push(cat)
  }

  const zoneMaterialCounts = STORAGE_ZONE_PLAN.map((_, zi) => MATERIAL_TEMPLATES.filter((t) => t.zoneIdx === zi).length)

  const now = new Date()
  let stockAllocated = 0
  const materials = []

  for (let i = 0; i < MATERIAL_TEMPLATES.length; i++) {
    const tpl = MATERIAL_TEMPLATES[i]
    const zone = STORAGE_ZONE_PLAN[tpl.zoneIdx]
    const cat = categories[tpl.zoneIdx]
    const code = `YJ-${zone.code}-${String(i + 1).padStart(3, '0')}`
    const material = await prisma.material.create({
      data: {
        code,
        name: tpl.name,
        spec: tpl.spec,
        unit: tpl.unit,
        manufacturer: '武汉市应急物资保障中心监制',
        categoryId: cat.id,
        supplierId: supplier.id,
      },
    })
    materials.push(material)

    const zoneShelves = shelves.filter((s) => s.zone === zone.code)

    const zoneTarget = CENTER.targetStock * zone.stockShare
    const qty = Math.round(zoneTarget / zoneMaterialCounts[tpl.zoneIdx])
    stockAllocated += qty

    const batchPlans = buildBatchPlans(i, tpl, now)
    let remainingQty = qty
    let qrSeq = 1

    for (let bi = 0; bi < batchPlans.length; bi++) {
      const plan = batchPlans[bi]
      const batchQty = bi === batchPlans.length - 1
        ? remainingQty
        : Math.max(1, Math.round(qty * plan.qtyShare))
      remainingQty -= batchQty

      const batch = await prisma.materialBatch.create({
        data: {
          batchNo: plan.batchNo,
          materialId: material.id,
          supplierId: supplier.id,
          productionDate: plan.productionDate,
          expiryDate: plan.expiryDate,
        },
      })

      const shelfForBatch = zoneShelves[(i + bi) % zoneShelves.length]
      const stockItem = await prisma.stockItem.create({
        data: {
          qrCode: genQrCode(code, plan.batchNo, qrSeq),
          materialId: material.id,
          batchId: batch.id,
          shelfId: shelfForBatch.id,
          quantity: batchQty,
          status: 'IN_STOCK',
        },
      })
      qrSeq++

      await prisma.stockMovement.create({
        data: {
          type: 'INBOUND',
          stockItemId: stockItem.id,
          quantity: batchQty,
          afterQty: batchQty,
          toShelfId: shelfForBatch.id,
          operatorId: admin.id,
          note: `采购入库赋码 ${stockItem.qrCode}`,
        },
      })
    }
  }

  // 低库存物资（医用口罩库存故意偏低，并从高库存物资微调总量）
  const maskMaterial = materials.find((m) => m.name === '医用口罩')
  if (maskMaterial) {
    const maskItems = await prisma.stockItem.findMany({
      where: { materialId: maskMaterial.id },
      orderBy: { quantity: 'desc' },
    })
    const totalMask = maskItems.reduce((sum, item) => sum + item.quantity, 0)
    const targetMask = 3200
    if (totalMask > targetMask && maskItems.length) {
      let toReduce = totalMask - targetMask
      for (const item of maskItems) {
        if (toReduce <= 0) break
        const cut = Math.min(item.quantity - 1, toReduce)
        if (cut <= 0) continue
        await prisma.stockItem.update({ where: { id: item.id }, data: { quantity: item.quantity - cut } })
        toReduce -= cut
      }
      const sandMaterial = materials.find((m) => m.name === '防汛沙袋')
      const sandItem = sandMaterial
        ? await prisma.stockItem.findFirst({ where: { materialId: sandMaterial.id }, orderBy: { quantity: 'desc' } })
        : null
      if (sandItem) {
        await prisma.stockItem.update({
          where: { id: sandItem.id },
          data: { quantity: sandItem.quantity + (totalMask - targetMask) },
        })
      }
    }
  }

  // 预警数据（效期 + 低库存 + 高库存）
  const alerts = [
    { type: 'EXPIRY' as const, level: 'RED' as const, materialIdx: 0, msg: '救灾专用棉被 批次临过期（≤30天），请优先出库' },
    { type: 'EXPIRY' as const, level: 'YELLOW' as const, materialIdx: 1, msg: '应急帐篷 批次临期预警（≤90天）' },
    { type: 'EXPIRY' as const, level: 'YELLOW' as const, materialIdx: 10, msg: '医用口罩 部分批次临期，建议 FIFO 优先' },
    { type: 'LOW_STOCK' as const, level: 'RED' as const, materialIdx: 10, msg: '医用口罩 库存 3,200，低于安全库存 10,000' },
    { type: 'LOW_STOCK' as const, level: 'RED' as const, materialIdx: 21, msg: '血液制品 库存不足，建议紧急采购' },
    { type: 'HIGH_STOCK' as const, level: 'YELLOW' as const, materialIdx: 5, msg: '防汛沙袋 库存接近上限，暂停采购' },
    { type: 'EXPIRY' as const, level: 'RED' as const, materialIdx: 22, msg: '疫苗冷藏箱 批次即将过期，禁止出库需处理' },
    { type: 'LOW_STOCK' as const, level: 'YELLOW' as const, materialIdx: 31, msg: '卫星电话 库存偏低，建议补货' },
  ]
  for (const a of alerts) {
    const mat = materials[a.materialIdx]
    const batch = await prisma.materialBatch.findFirst({
      where: { materialId: mat.id },
      orderBy: a.type === 'EXPIRY' ? { expiryDate: 'asc' } : { createdAt: 'asc' },
    })
    await prisma.alert.create({
      data: { type: a.type, level: a.level, materialId: mat.id, batchId: batch?.id, message: a.msg },
    })
  }

  const supervisor = await prisma.user.findUniqueOrThrow({ where: { username: 'supervisor' } })
  const approverId = supervisor.id

  // —— 采购入库演示单（覆盖各状态，含多条「审核通过 / 收货中」可赋码打码）——
  const inboundDemo: Array<{
    orderNo: string
    status: 'DRAFT' | 'PENDING' | 'RECEIVING' | 'COMPLETED' | 'CANCELLED'
    contractNo?: string
    remark?: string
    lines: Array<{ materialIdx: number; expectedQty: number; actualQty?: number; batchNo?: string; productionDate?: Date; expiryDate?: Date }>
  }> = [
    {
      orderNo: 'CG20260629001',
      status: 'DRAFT',
      contractNo: 'CG-HT-2026-080',
      lines: [{ materialIdx: 12, expectedQty: 5000 }],
    },
    {
      orderNo: 'CG20260629002',
      status: 'PENDING',
      contractNo: 'CG-HT-2026-088',
      lines: [
        { materialIdx: 10, expectedQty: 50000 },
        { materialIdx: 11, expectedQty: 20000 },
      ],
    },
    {
      orderNo: 'CG20260629003',
      status: 'PENDING',
      contractNo: 'CG-HT-2026-089',
      lines: [{ materialIdx: 5, expectedQty: 8000 }],
    },
    {
      orderNo: 'CG20260629004',
      status: 'RECEIVING',
      contractNo: 'CG-HT-2026-091',
      remark: '审核通过 · 待收货赋码（棉被）',
      lines: [{ materialIdx: 0, expectedQty: 3000 }],
    },
    {
      orderNo: 'CG20260629005',
      status: 'RECEIVING',
      contractNo: 'CG-HT-2026-092',
      remark: '审核通过 · 待收货赋码（帐篷+折叠床）',
      lines: [
        { materialIdx: 1, expectedQty: 500 },
        { materialIdx: 2, expectedQty: 800 },
      ],
    },
    {
      orderNo: 'CG20260629006',
      status: 'RECEIVING',
      contractNo: 'CG-HT-2026-093',
      remark: '审核通过 · 待收货赋码（医用耗材）',
      lines: [
        { materialIdx: 10, expectedQty: 30000 },
        { materialIdx: 11, expectedQty: 15000 },
        { materialIdx: 12, expectedQty: 8000 },
      ],
    },
    {
      orderNo: 'CG20260629007',
      status: 'COMPLETED',
      contractNo: 'CG-HT-2026-085',
      remark: '已完成入库参考',
      lines: [
        {
          materialIdx: 15,
          expectedQty: 2000,
          actualQty: 2000,
          batchNo: '20250318-B',
          productionDate: new Date('2025-03-18'),
          expiryDate: addMonths(new Date('2025-03-18'), MATERIAL_TEMPLATES[15].shelfLife),
        },
      ],
    },
  ]

  for (const order of inboundDemo) {
    const approved = order.status === 'RECEIVING' || order.status === 'COMPLETED'
    const firstMaterialIdx = order.lines[0]?.materialIdx ?? 0
    const whCode = warehouseCodeForMaterialZone(MATERIAL_TEMPLATES[firstMaterialIdx]?.zoneIdx ?? 2)
    await prisma.inboundOrder.create({
      data: {
        orderNo: order.orderNo,
        type: 'PURCHASE',
        status: order.status,
        warehouseId: warehouseByCode.get(whCode)?.id,
        supplierId: supplier.id,
        contractNo: order.contractNo,
        remark: order.remark,
        createdById: admin.id,
        approvedById: approved ? approverId : undefined,
        approvedAt: approved ? now : undefined,
        lines: {
          create: order.lines.map((line) => ({
            materialId: materials[line.materialIdx].id,
            expectedQty: line.expectedQty,
            actualQty: line.actualQty,
            batchNo: line.batchNo,
            productionDate: line.productionDate,
            expiryDate: line.expiryDate,
          })),
        },
      },
    })
  }

  // —— 出库演示单（含多条审核通过 / 拣货中，可测 FIFO 与拆零打码）——
  const outboundDemo: Array<{
    orderNo: string
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PICKING' | 'SHIPPED' | 'COMPLETED' | 'REJECTED'
    purpose: string
    destination: string
    recipient: string
    remark?: string
    rejectReason?: string
    lines: Array<{ materialIdx: number; requestedQty: number; pickedQty?: number }>
  }> = [
    {
      orderNo: 'OUT20260629001',
      status: 'DRAFT',
      purpose: '草稿调拨',
      destination: '江岸区',
      recipient: '江岸区应急局',
      lines: [{ materialIdx: 3, requestedQty: 200 }],
    },
    {
      orderNo: 'OUT20260629002',
      status: 'PENDING',
      purpose: '防汛抢险',
      destination: '洪山区',
      recipient: '洪山区防汛办',
      lines: [{ materialIdx: 5, requestedQty: 500 }],
    },
    {
      orderNo: 'OUT20260629003',
      status: 'PENDING',
      purpose: '救灾调拨',
      destination: '蔡甸区',
      recipient: '蔡甸区民政局',
      lines: [{ materialIdx: 1, requestedQty: 120 }],
    },
    {
      orderNo: 'OUT20260629004',
      status: 'APPROVED',
      purpose: '防疫物资',
      destination: '黄陂区',
      recipient: '黄陂区卫健委',
      remark: '审核通过 · 可开始拣货',
      lines: [{ materialIdx: 10, requestedQty: 5000 }],
    },
    {
      orderNo: 'OUT20260629005',
      status: 'APPROVED',
      purpose: '冬季防寒',
      destination: '新洲区',
      recipient: '新洲区应急局',
      remark: '审核通过 · 可开始拣货',
      lines: [
        { materialIdx: 0, requestedQty: 800 },
        { materialIdx: 33, requestedQty: 1500 },
      ],
    },
    {
      orderNo: 'OUT20260629006',
      status: 'APPROVED',
      purpose: '应急演练',
      destination: '东西湖区',
      recipient: '东西湖储备库',
      remark: '审核通过 · 可开始拣货',
      lines: [{ materialIdx: 6, requestedQty: 30 }],
    },
    {
      orderNo: 'OUT20260629007',
      status: 'PICKING',
      purpose: '临期优先出库',
      destination: '武昌区',
      recipient: '武昌区救灾中心',
      remark: '拣货中 · 可 FIFO 拣货 / 拆零打码',
      lines: [{ materialIdx: 10, requestedQty: 2000, pickedQty: 0 }],
    },
    {
      orderNo: 'OUT20260629008',
      status: 'PICKING',
      purpose: '部分拣货演示',
      destination: '汉阳区',
      recipient: '汉阳区应急局',
      remark: '拣货中 · 已拣部分',
      lines: [{ materialIdx: 1, requestedQty: 100, pickedQty: 40 }],
    },
    {
      orderNo: 'OUT20260629009',
      status: 'SHIPPED',
      purpose: '已完成拣货待结案',
      destination: '硚口区',
      recipient: '硚口区民政局',
      lines: [{ materialIdx: 4, requestedQty: 300, pickedQty: 300 }],
    },
    {
      orderNo: 'OUT20260629010',
      status: 'COMPLETED',
      purpose: '历史出库参考',
      destination: '青山区',
      recipient: '青山区应急局',
      lines: [{ materialIdx: 8, requestedQty: 150, pickedQty: 150 }],
    },
    {
      orderNo: 'OUT20260629011',
      status: 'REJECTED',
      purpose: '调拨申请',
      destination: '江夏区',
      recipient: '江夏区防汛办',
      rejectReason: '库存不足，驳回补货后再申请',
      lines: [{ materialIdx: 21, requestedQty: 50 }],
    },
  ]

  for (let i = 0; i < outboundDemo.length; i++) {
    const order = outboundDemo[i]
    const approved = ['APPROVED', 'PICKING', 'SHIPPED', 'COMPLETED'].includes(order.status)
    await prisma.outboundOrder.create({
      data: {
        orderNo: order.orderNo,
        status: order.status,
        purpose: order.remark ? `${order.purpose}（${order.remark}）` : order.purpose,
        destination: order.destination,
        recipient: order.recipient,
        rejectReason: order.rejectReason,
        createdById: admin.id,
        approvedById: approved ? approverId : undefined,
        approvedAt: approved ? addDays(now, -i) : undefined,
        completedAt: order.status === 'COMPLETED' ? addDays(now, -3) : undefined,
        lines: {
          create: order.lines.map((line) => ({
            materialId: materials[line.materialIdx].id,
            requestedQty: line.requestedQty,
            pickedQty: line.pickedQty ?? 0,
          })),
        },
      },
    })
  }

  const keeper = await prisma.user.findUniqueOrThrow({ where: { username: 'keeper' } })
  const demoLogs = [
    {
      userId: admin.id,
      action: 'LOGIN' as const,
      module: 'AUTH' as const,
      summary: '系统管理员 登录系统',
      targetLabel: 'admin',
      ipAddress: '192.168.1.10',
      createdAt: addDays(now, -1),
    },
    {
      userId: keeper.id,
      action: 'SHELVE' as const,
      module: 'STOCK' as const,
      summary: '物资上架至货位 A-01-01',
      targetLabel: 'MAT-001-B001-1234',
      createdAt: addDays(now, -1),
      detail: seedLogDetail(
        { shelf: '—', status: '待上架' },
        { shelf: 'A-01-01', status: '在库' },
        { labels: { shelf: '货位' } },
      ),
    },
    {
      userId: admin.id,
      action: 'SYNC' as const,
      module: 'ALERT' as const,
      summary: '同步效期预警，新增 12 条',
      createdAt: addDays(now, -1),
      detail: seedLogDetail(
        { expiryAlertCount: 38 },
        { expiryAlertCount: 50 },
        { labels: { expiryAlertCount: '效期预警数' } },
      ),
    },
    {
      userId: keeper.id,
      action: 'PICK' as const,
      module: 'OUTBOUND' as const,
      summary: '拣货 防汛沙袋 × 200',
      targetLabel: 'OUT20260629002',
      createdAt: addDays(now, -1),
      detail: seedLogDetail(
        { pickedQty: 0, status: '已审核' },
        { pickedQty: 200, status: '拣货中' },
        { labels: { pickedQty: '拣货数量' } },
      ),
    },
    {
      userId: supervisor.id,
      action: 'APPROVE' as const,
      module: 'INBOUND' as const,
      summary: '审核通过入库单 CG20260629001',
      targetLabel: 'CG20260629001',
      createdAt: addDays(now, -2),
      detail: seedLogDetail(
        { status: '待审核', contractNo: 'CG-HT-2026-080' },
        { status: '收货中', contractNo: 'CG-HT-2026-080' },
      ),
    },
    {
      userId: keeper.id,
      action: 'RECEIVE' as const,
      module: 'INBOUND' as const,
      summary: '入库收货赋码 MAT-001-B001-1234，数量 500',
      targetLabel: 'CG20260629001',
      createdAt: addDays(now, -2),
      detail: seedLogDetail(
        { receivedQty: 0, traceCode: '—' },
        { receivedQty: 500, traceCode: 'MAT-001-B001-1234' },
        { labels: { receivedQty: '收货数量', traceCode: '赋码' } },
      ),
    },
    {
      userId: supervisor.id,
      action: 'APPROVE' as const,
      module: 'OUTBOUND' as const,
      summary: '审核通过出库单 OUT20260629001',
      targetLabel: 'OUT20260629001',
      createdAt: addDays(now, -3),
      detail: seedLogDetail(
        { status: '待审核', purpose: '防汛应急调拨' },
        { status: '已审核', purpose: '防汛应急调拨' },
      ),
    },
    {
      userId: admin.id,
      action: 'UPDATE' as const,
      module: 'MATERIAL' as const,
      summary: '更新物资「探照灯」',
      targetLabel: 'MAT-040',
      createdAt: addDays(now, -4),
      detail: seedLogDetail(
        { name: '探照灯', unit: '盏', safetyStockMin: 50, manufacturer: '—' },
        { name: '探照灯', unit: '盏', safetyStockMin: 100, manufacturer: '武汉光电科技' },
      ),
    },
    {
      userId: admin.id,
      action: 'UPDATE' as const,
      module: 'SUPPLIER' as const,
      summary: '更新供应商「华中应急物资供应有限公司」',
      targetLabel: 'SUP-001',
      createdAt: addDays(now, -4),
      detail: seedLogDetail(
        { contact: '张经理', phone: '027-88886666' },
        { contact: '张经理', phone: '027-88887777' },
      ),
    },
    {
      userId: admin.id,
      action: 'CREATE' as const,
      module: 'MATERIAL' as const,
      summary: '新增物资「探照灯」',
      targetLabel: 'MAT-040',
      createdAt: addDays(now, -5),
      detail: seedLogDetail(null, {
        code: 'MAT-040',
        name: '探照灯',
        spec: '1000W',
        unit: '盏',
        safetyStockMin: 50,
        safetyStockMax: 500,
      }),
    },
  ]
  for (const log of demoLogs) {
    await prisma.systemLog.create({ data: log })
  }

  const printTemplateCount = await seedPrintTemplates(prisma)

  console.log('✅ Seed complete — 方案基准数据')
  console.log(`   物资品种: ${materials.length} 种`)
  console.log(`   库存总量: ~${stockAllocated.toLocaleString()} 件`)
  console.log(`   库房: 中心主库 + 战略备库 · A/B/C/D 四区分区 · 货位 ${shelves.length} 个`)
  console.log(`   入库单: ${inboundDemo.length} 单（收货中 ${inboundDemo.filter((o) => o.status === 'RECEIVING').length} · 待审核 ${inboundDemo.filter((o) => o.status === 'PENDING').length}）`)
  console.log(`   出库单: ${outboundDemo.length} 单（已审核 ${outboundDemo.filter((o) => o.status === 'APPROVED').length} · 拣货中 ${outboundDemo.filter((o) => o.status === 'PICKING').length}）`)
  console.log(`   预警: ${alerts.length} 条`)
  console.log(`   系统日志: ${demoLogs.length} 条演示记录`)
  console.log(`   打印模板: ${printTemplateCount} 个`)
  console.log('   账号: admin / supervisor / keeper / viewer — 密码 123456')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
