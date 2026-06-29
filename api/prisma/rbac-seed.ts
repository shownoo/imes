import type { PrismaClient } from '@prisma/client'
import { PERMISSIONS, ROLE_DEFS, resolveRolePermissionCodes } from '../src/lib/permissions.js'

export async function seedRbac(prisma: PrismaClient) {
  for (const def of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: def.code },
      update: { name: def.name, module: def.module, action: def.action, description: def.description },
      create: def,
    })
  }

  const allPermissions = await prisma.permission.findMany()
  const permByCode = Object.fromEntries(allPermissions.map((p) => [p.code, p.id]))

  const roles: Record<string, string> = {}
  for (const def of ROLE_DEFS) {
    const role = await prisma.role.upsert({
      where: { code: def.code },
      update: { name: def.name, description: def.description, system: def.system, sort: def.sort },
      create: {
        code: def.code,
        name: def.name,
        description: def.description,
        system: def.system,
        sort: def.sort,
      },
    })
    roles[def.code] = role.id

    const codes = resolveRolePermissionCodes(def.permissions)
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    if (codes.length > 0) {
      await prisma.rolePermission.createMany({
        data: codes.map((code) => ({
          roleId: role.id,
          permissionId: permByCode[code],
        })),
        skipDuplicates: true,
      })
    }
  }

  return roles
}
