import bcrypt from 'bcryptjs'
import type { PrismaClient } from '@prisma/client'
import { seedPrintTemplates } from '../../scripts/lib/seed-print-templates.js'
import { DEFAULT_NOTIFY_CONFIG } from '../../src/lib/approval-types.js'
import { seedApprovalFlows } from '../approval-seed.js'
import { seedRbac } from '../rbac-seed.js'
import {
  OUTBOUND_DESTINATIONS,
  REQUIRED_OUTBOUND_PURPOSES,
} from './required-data.js'

export type RequiredSeedResult = {
  roles: Record<string, string>
  adminId: string
  printTemplateCount: number
}

/** 系统运行必需的基础数据（RBAC、审批流、字典、管理员账号等） */
export async function seedRequired(prisma: PrismaClient): Promise<RequiredSeedResult> {
  const password = await bcrypt.hash('123456', 10)
  const roles = await seedRbac(prisma)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { roleId: roles.ADMIN },
    create: { username: 'admin', password, name: '系统管理员', roleId: roles.ADMIN },
  })

  await seedApprovalFlows()
  await prisma.systemSetting.upsert({
    where: { key: 'approval_notify' },
    create: { key: 'approval_notify', value: DEFAULT_NOTIFY_CONFIG as never },
    update: {},
  })
  await prisma.systemSetting.upsert({
    where: { key: 'org_city' },
    create: { key: 'org_city', value: { city: '武汉市' } },
    update: {},
  })

  for (const def of REQUIRED_OUTBOUND_PURPOSES) {
    await prisma.outboundPurpose.upsert({
      where: { code: def.code },
      create: def,
      update: { name: def.name, sortOrder: def.sortOrder, enabled: true },
    })
  }

  for (const def of OUTBOUND_DESTINATIONS) {
    await prisma.outboundDestination.upsert({
      where: { code: def.code },
      create: def,
      update: {
        city: def.city,
        district: def.district,
        name: def.name,
        sortOrder: def.sortOrder,
        enabled: true,
      },
    })
  }

  const printTemplateCount = await seedPrintTemplates(prisma)

  return { roles, adminId: admin.id, printTemplateCount }
}
