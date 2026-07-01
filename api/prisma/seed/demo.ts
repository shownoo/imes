import bcrypt from 'bcryptjs'
import type { Prisma, PrismaClient } from '@prisma/client'
import { buildChangeDetail } from '../../src/lib/log-diff.js'
import { genQrCode } from '../../src/lib/utils.js'
import {
  STORAGE_ZONE_PLAN,
  WAREHOUSE_PLAN,
  warehouseCodeForMaterialZone,
} from '../../src/lib/warehouse-layout.js'
import {
  addDays,
  addMonths,
  buildBatchPlans,
  CENTER,
  MATERIAL_TEMPLATES,
} from './demo-materials.js'
import { DEMO_OUTBOUND_PURPOSES } from './required-data.js'
import type { RequiredSeedResult } from './required.js'

function seedLogDetail(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  options?: { fields?: string[]; labels?: Record<string, string> },
): Prisma.InputJsonValue {
  return buildChangeDetail(before, after, options) as Prisma.InputJsonValue
}

async function resetDemoData(prisma: PrismaClient) {
  await prisma.approvalTask.deleteMany()
  await prisma.approvalInstance.deleteMany()
  await prisma.systemLog.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.stocktakeLine.deleteMany()
  await prisma.stocktakeTask.deleteMany()
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

export type DemoSeedResult = {
  materialCount: number
  stockAllocated: number
  shelfCount: number
  inboundOrderCount: number
  inboundReceivingCount: number
  inboundPendingCount: number
  outboundOrderCount: number
  outboundApprovedCount: number
  outboundPickingCount: number
  alertCount: number
  logCount: number
}

/** 演示数据：库房布局、库存、单据、预警、日志及演示账号 */
export async function seedDemo(
  prisma: PrismaClient,
  required: Pick<RequiredSeedResult, 'roles' | 'adminId'>,
): Promise<DemoSeedResult> {
  const password = await bcrypt.hash('123456', 10)
  const { roles, adminId: admin } = required

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

  for (const def of DEMO_OUTBOUND_PURPOSES) {
    await prisma.outboundPurpose.upsert({
      where: { code: def.code },
      create: def,
      update: { name: def.name, sortOrder: def.sortOrder, enabled: true },
    })
  }

  await resetDemoData(prisma)

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

  const CATEGORY_NAMES: Record<string, string> = {
    A: '抢险装备',
    B: '救灾安置',
    C: '通用保障',
    D: '恒温冷链',
  }

  const categories = []
  for (const z of STORAGE_ZONE_PLAN) {
    const cat = await prisma.materialCategory.create({
      data: {
        code: `MT-${z.code}`,
        name: CATEGORY_NAMES[z.code] ?? z.name,
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
          operatorId: admin,
          note: `采购入库赋码 ${stockItem.qrCode}`,
        },
      })
    }
  }

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
        createdById: admin,
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
      destination: '江岸区应急保障局',
      recipient: '江岸区应急局',
      lines: [{ materialIdx: 3, requestedQty: 200 }],
    },
    {
      orderNo: 'OUT20260629002',
      status: 'PENDING',
      purpose: '防汛抢险',
      destination: '洪山区应急保障局',
      recipient: '洪山区防汛办',
      lines: [{ materialIdx: 5, requestedQty: 500 }],
    },
    {
      orderNo: 'OUT20260629003',
      status: 'PENDING',
      purpose: '救灾调拨',
      destination: '蔡甸区应急保障局',
      recipient: '蔡甸区民政局',
      lines: [{ materialIdx: 1, requestedQty: 120 }],
    },
    {
      orderNo: 'OUT20260629004',
      status: 'APPROVED',
      purpose: '防疫物资',
      destination: '黄陂区应急保障局',
      recipient: '黄陂区卫健委',
      remark: '审核通过 · 可开始拣货',
      lines: [{ materialIdx: 10, requestedQty: 5000 }],
    },
    {
      orderNo: 'OUT20260629005',
      status: 'APPROVED',
      purpose: '冬季防寒',
      destination: '新洲区应急保障局',
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
      destination: '东西湖区应急保障局',
      recipient: '东西湖储备库',
      remark: '审核通过 · 可开始拣货',
      lines: [{ materialIdx: 6, requestedQty: 30 }],
    },
    {
      orderNo: 'OUT20260629007',
      status: 'PICKING',
      purpose: '临期优先出库',
      destination: '武昌区应急保障局',
      recipient: '武昌区救灾中心',
      remark: '拣货中 · 可 FIFO 拣货 / 拆零打码',
      lines: [{ materialIdx: 10, requestedQty: 2000, pickedQty: 0 }],
    },
    {
      orderNo: 'OUT20260629008',
      status: 'PICKING',
      purpose: '部分拣货演示',
      destination: '汉阳区应急保障局',
      recipient: '汉阳区应急局',
      remark: '拣货中 · 已拣部分',
      lines: [{ materialIdx: 1, requestedQty: 100, pickedQty: 40 }],
    },
    {
      orderNo: 'OUT20260629009',
      status: 'SHIPPED',
      purpose: '防汛应急物资调拨',
      destination: '硚口区应急保障局',
      recipient: '硚口区民政局',
      lines: [{ materialIdx: 4, requestedQty: 300, pickedQty: 300 }],
    },
    {
      orderNo: 'OUT20260629010',
      status: 'COMPLETED',
      purpose: '历史出库参考',
      destination: '青山区应急保障局',
      recipient: '青山区应急局',
      lines: [{ materialIdx: 8, requestedQty: 150, pickedQty: 150 }],
    },
    {
      orderNo: 'OUT20260629011',
      status: 'REJECTED',
      purpose: '调拨申请',
      destination: '江夏区应急保障局',
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
        purpose: order.purpose,
        destination: order.destination,
        recipient: order.recipient,
        rejectReason: order.rejectReason,
        createdById: admin,
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
      userId: admin,
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
      userId: admin,
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
      userId: admin,
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
      userId: admin,
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
      userId: admin,
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

  const demoShelf = shelves[0]
  const demoStockItems = await prisma.stockItem.findMany({
    where: { shelfId: demoShelf?.id, status: 'IN_STOCK' },
    take: 5,
  })
  if (demoShelf && demoStockItems.length >= 2) {
    await prisma.stocktakeTask.create({
      data: {
        taskNo: 'PD20260630001',
        title: `货位 ${demoShelf.code} 盘点`,
        status: 'IN_PROGRESS',
        warehouseId: demoShelf.warehouseId,
        shelfId: demoShelf.id,
        createdById: keeper.id,
        lines: {
          create: demoStockItems.map((item, idx) => ({
            stockItemId: item.id,
            bookQty: item.quantity,
            ...(idx === 0
              ? {
                  actualQty: item.quantity,
                  countedAt: addDays(now, -1),
                  countedById: keeper.id,
                }
              : {}),
          })),
        },
      },
    })
  }

  return {
    materialCount: materials.length,
    stockAllocated,
    shelfCount: shelves.length,
    inboundOrderCount: inboundDemo.length,
    inboundReceivingCount: inboundDemo.filter((o) => o.status === 'RECEIVING').length,
    inboundPendingCount: inboundDemo.filter((o) => o.status === 'PENDING').length,
    outboundOrderCount: outboundDemo.length,
    outboundApprovedCount: outboundDemo.filter((o) => o.status === 'APPROVED').length,
    outboundPickingCount: outboundDemo.filter((o) => o.status === 'PICKING').length,
    alertCount: alerts.length,
    logCount: demoLogs.length,
  }
}
