/**
 * RBAC 无损迁移脚本：将 User.role 枚举迁移为 User.roleId 外键
 * 用法: cd api && pnpm exec tsx prisma/migrate-rbac.ts
 */
import { PrismaClient } from '@prisma/client'
import { seedRbac } from './rbac-seed.js'

const prisma = new PrismaClient()

async function columnExists(table: string, column: string) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    ) AS exists
  `
  return rows[0]?.exists ?? false
}

async function tableExists(table: string) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS exists
  `
  return rows[0]?.exists ?? false
}

async function main() {
  const hasRoleId = await columnExists('User', 'roleId')
  if (hasRoleId && !(await columnExists('User', 'role'))) {
    console.log('✅ RBAC 已迁移，跳过')
    await seedRbac(prisma)
    return
  }

  if (!(await tableExists('Role'))) {
    console.log('→ 创建 RBAC 表结构...')
    const ddl = [
      `CREATE TABLE IF NOT EXISTS "Role" (
        "id" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "code" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "system" BOOLEAN NOT NULL DEFAULT false,
        "sort" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Role_code_key" ON "Role"("code")`,
      `CREATE TABLE IF NOT EXISTS "Permission" (
        "id" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "code" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "module" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "description" TEXT,
        CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key" ON "Permission"("code")`,
      `CREATE TABLE IF NOT EXISTS "RolePermission" (
        "roleId" TEXT NOT NULL,
        "permissionId" TEXT NOT NULL,
        CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
      )`,
    ]
    for (const sql of ddl) await prisma.$executeRawUnsafe(sql)
  }

  console.log('→ 初始化角色与权限...')
  const roles = await seedRbac(prisma)

  if (!(await columnExists('User', 'roleId'))) {
    console.log('→ 添加 User.roleId 列...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roleId" TEXT;`)
  }

  if (await columnExists('User', 'role')) {
    console.log('→ 迁移用户角色数据...')
    const mapping: Record<string, string> = {
      ADMIN: roles.ADMIN,
      SUPERVISOR: roles.SUPERVISOR,
      WAREHOUSE_KEEPER: roles.WAREHOUSE_KEEPER,
      VIEWER: roles.VIEWER,
    }
    for (const [code, roleId] of Object.entries(mapping)) {
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "roleId" = $1 WHERE "role"::text = $2 AND "roleId" IS NULL`,
        roleId,
        code,
      )
    }
    const fallback = roles.WAREHOUSE_KEEPER
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "roleId" = $1 WHERE "roleId" IS NULL`,
      fallback,
    )
    console.log('→ 删除旧 role 列...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" DROP COLUMN IF EXISTS "role";`)
  }

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_roleId_fkey') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey"
          FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
    END $$;
  `)
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;`)

  console.log('✅ RBAC 迁移完成（LogModule 扩展由 prisma db push 同步）')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
