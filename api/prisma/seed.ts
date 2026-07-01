import { PrismaClient } from '@prisma/client'
import { seedDemo } from './seed/demo.js'
import { seedRequired } from './seed/required.js'

const prisma = new PrismaClient()

export type SeedMode = 'required' | 'demo' | 'all'

function parseSeedMode(): SeedMode {
  const raw = process.env.SEED_MODE?.toLowerCase()
  if (raw === 'required' || raw === 'demo' || raw === 'all') return raw
  return 'all'
}

async function main() {
  const mode = parseSeedMode()
  let requiredResult: Awaited<ReturnType<typeof seedRequired>> | undefined

  if (mode === 'required' || mode === 'all') {
    requiredResult = await seedRequired(prisma)
    console.log('✅ Required seed complete')
    console.log(`   RBAC · 审批流 · 系统设置 · 出库字典 · 打印模板 ${requiredResult.printTemplateCount} 个`)
    console.log('   账号: admin — 密码 123456')
  }

  if (mode === 'demo' || mode === 'all') {
    if (!requiredResult) {
      const admin = await prisma.user.findUnique({ where: { username: 'admin' } })
      if (!admin) {
        throw new Error('Demo seed 需要先执行 required seed（SEED_MODE=required 或 all）')
      }
      const roles = Object.fromEntries(
        (await prisma.role.findMany({ select: { code: true, id: true } })).map((r) => [r.code, r.id]),
      )
      requiredResult = { roles, adminId: admin.id, printTemplateCount: 0 }
    }

    const demo = await seedDemo(prisma, requiredResult)
    console.log('✅ Demo seed complete')
    console.log(`   物资品种: ${demo.materialCount} 种 · 库存总量 ~${demo.stockAllocated.toLocaleString()} 件`)
    console.log(`   库房: 中心主库 + 战略备库 · A/B/C/D 四区 · 货位 ${demo.shelfCount} 个`)
    console.log(`   入库单: ${demo.inboundOrderCount} 单（收货中 ${demo.inboundReceivingCount} · 待审核 ${demo.inboundPendingCount}）`)
    console.log(`   出库单: ${demo.outboundOrderCount} 单（已审核 ${demo.outboundApprovedCount} · 拣货中 ${demo.outboundPickingCount}）`)
    console.log(`   预警: ${demo.alertCount} 条 · 系统日志: ${demo.logCount} 条`)
    console.log('   演示账号: supervisor / keeper / viewer — 密码 123456')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
