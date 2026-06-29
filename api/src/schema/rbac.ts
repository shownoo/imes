import bcrypt from 'bcryptjs'
import { builder } from '../builder.js'
import { writeSystemLog } from '../lib/system-log.js'
import { serializeUser, userInclude } from '../lib/rbac.js'
import { IdInput, PaginationInput } from './input-types.js'

function snapUser(user: {
  username: string
  name: string | null
  phone: string | null
  email: string | null
  active: boolean
  role?: { name: string }
}) {
  return {
    username: user.username,
    name: user.name,
    phone: user.phone,
    email: user.email,
    active: user.active,
    role: user.role?.name,
  }
}

const AddUserInput = builder.inputType('AddUserInput', {
  fields: (t) => ({
    id: t.id({ required: false }),
    username: t.string({ required: true }),
    password: t.string({ required: false }),
    name: t.string({ required: false }),
    phone: t.string({ required: false }),
    email: t.string({ required: false }),
    roleId: t.id({ required: true }),
    active: t.boolean({ required: false }),
  }),
})

const ResetPasswordInput = builder.inputType('ResetPasswordInput', {
  fields: (t) => ({
    id: t.id({ required: true }),
    password: t.string({ required: true }),
  }),
})

const SetUserActiveInput = builder.inputType('SetUserActiveInput', {
  fields: (t) => ({
    id: t.id({ required: true }),
    active: t.boolean({ required: true }),
  }),
})

const AddRoleInput = builder.inputType('AddRoleInput', {
  fields: (t) => ({
    id: t.id({ required: false }),
    code: t.string({ required: true }),
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    sort: t.int({ required: false }),
  }),
})

const SetRolePermissionsInput = builder.inputType('SetRolePermissionsInput', {
  fields: (t) => ({
    roleId: t.id({ required: true }),
    permissionIds: t.idList({ required: true }),
  }),
})

function formatRole(role: {
  id: string
  code: string
  name: string
  description: string | null
  system: boolean
  sort: number
  permissions: Array<{ permission: { id: string; code: string; name: string; module: string; action: string } }>
  _count?: { users: number }
}) {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    system: role.system,
    sort: role.sort,
    userCount: role._count?.users ?? 0,
    permissions: role.permissions.map((rp) => rp.permission),
  }
}

// —— 用户 ——

builder.queryField('getUsers', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { systemRead: true },
    args: { input: t.arg({ type: PaginationInput, required: false }) },
    resolve: async (_, { input }, ctx) => {
      const where: Record<string, unknown> = {}
      if (input?.search) {
        where.OR = [
          { username: { contains: input.search, mode: 'insensitive' } },
          { name: { contains: input.search, mode: 'insensitive' } },
          { phone: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } },
        ]
      }
      const [users, count] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          take: input?.take ?? 50,
          skip: input?.skip ?? 0,
          orderBy: [{ active: 'desc' }, { username: 'asc' }],
          include: userInclude,
        }),
        ctx.prisma.user.count({ where }),
      ])
      return { users: users.map(serializeUser), count }
    },
  }),
)

builder.queryField('getUser', (t) =>
  t.field({
    type: 'JSON',
    nullable: true,
    authScopes: { systemRead: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        include: userInclude,
      })
      return user ? serializeUser(user) : null
    },
  }),
)

builder.mutationField('addUser', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { systemWrite: true },
    args: { input: t.arg({ type: AddUserInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { id, password, ...data } = input
      if (!id && !password) throw new Error('新建用户必须设置密码')

      if (id) {
        const existing = await ctx.prisma.user.findUniqueOrThrow({ where: { id }, include: userInclude })
        if (id === ctx.identity!.userId && data.active === false) {
          throw new Error('不能停用自己的账号')
        }
        const updateData: Record<string, unknown> = { ...data }
        if (password) updateData.password = await bcrypt.hash(password, 10)
        const user = await ctx.prisma.user.update({
          where: { id },
          data: updateData as never,
          include: userInclude,
        })
        await writeSystemLog(ctx, {
          action: 'UPDATE',
          module: 'USER',
          summary: `更新用户 ${user.username}`,
          targetId: user.id,
          targetLabel: user.username,
          before: snapUser(existing),
          after: snapUser(user),
        })
        return serializeUser(user)
      }

      const exists = await ctx.prisma.user.findUnique({ where: { username: data.username } })
      if (exists) throw new Error('用户名已存在')

      const user = await ctx.prisma.user.create({
        data: {
          ...data,
          password: await bcrypt.hash(password!, 10),
          active: data.active ?? true,
        } as never,
        include: userInclude,
      })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'USER',
        summary: `创建用户 ${user.username}`,
        targetId: user.id,
        targetLabel: user.username,
      })
      return serializeUser(user)
    },
  }),
)

builder.mutationField('resetUserPassword', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { systemWrite: true },
    args: { input: t.arg({ type: ResetPasswordInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const user = await ctx.prisma.user.update({
        where: { id: input.id },
        data: { password: await bcrypt.hash(input.password, 10) },
        include: userInclude,
      })
      await writeSystemLog(ctx, {
        action: 'UPDATE',
        module: 'USER',
        summary: `重置用户 ${user.username} 密码`,
        targetId: user.id,
        targetLabel: user.username,
        before: { password: '******' },
        after: { password: '******' },
      })
      return serializeUser(user)
    },
  }),
)

builder.mutationField('setUserActive', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { systemWrite: true },
    args: { input: t.arg({ type: SetUserActiveInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      if (input.id === ctx.identity!.userId && !input.active) {
        throw new Error('不能停用自己的账号')
      }
      if (!input.active) {
        const adminRole = await ctx.prisma.role.findUnique({ where: { code: 'ADMIN' } })
        if (adminRole) {
          const activeAdmins = await ctx.prisma.user.count({
            where: { roleId: adminRole.id, active: true, NOT: { id: input.id } },
          })
          const target = await ctx.prisma.user.findUnique({ where: { id: input.id } })
          if (target?.roleId === adminRole.id && activeAdmins === 0) {
            throw new Error('不能停用最后一个管理员账号')
          }
        }
      }
      const before = await ctx.prisma.user.findUniqueOrThrow({
        where: { id: input.id },
        include: userInclude,
      })
      const user = await ctx.prisma.user.update({
        where: { id: input.id },
        data: { active: input.active },
        include: userInclude,
      })
      await writeSystemLog(ctx, {
        action: 'UPDATE',
        module: 'USER',
        summary: `${input.active ? '启用' : '停用'}用户 ${user.username}`,
        targetId: user.id,
        targetLabel: user.username,
        before: snapUser(before),
        after: snapUser(user),
      })
      return serializeUser(user)
    },
  }),
)

// —— 角色 ——

builder.queryField('getRoles', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { systemRead: true },
    resolve: async (_, __, ctx) => {
      const roles = await ctx.prisma.role.findMany({
        orderBy: [{ sort: 'asc' }, { code: 'asc' }],
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
      })
      return { roles: roles.map(formatRole), count: roles.length }
    },
  }),
)

builder.queryField('getRole', (t) =>
  t.field({
    type: 'JSON',
    nullable: true,
    authScopes: { systemRead: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.id },
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
      })
      return role ? formatRole(role) : null
    },
  }),
)

builder.queryField('getPermissions', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { systemRead: true },
    resolve: async (_, __, ctx) => {
      const permissions = await ctx.prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
      })
      const byModule: Record<string, typeof permissions> = {}
      for (const p of permissions) {
        if (!byModule[p.module]) byModule[p.module] = []
        byModule[p.module].push(p)
      }
      return { permissions, byModule, count: permissions.length }
    },
  }),
)

builder.mutationField('addRole', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { systemWrite: true },
    args: { input: t.arg({ type: AddRoleInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { id, ...data } = input
      if (id) {
        const existing = await ctx.prisma.role.findUnique({ where: { id } })
        if (!existing) throw new Error('角色不存在')
        if (existing.system && existing.code !== data.code) {
          throw new Error('内置角色不可修改编码')
        }
        const role = await ctx.prisma.role.update({
          where: { id },
          data: data as never,
          include: {
            permissions: { include: { permission: true } },
            _count: { select: { users: true } },
          },
        })
        await writeSystemLog(ctx, {
          action: 'UPDATE',
          module: 'ROLE',
          summary: `更新角色 ${role.name}`,
          targetId: role.id,
          targetLabel: role.code,
          before: {
            code: existing.code,
            name: existing.name,
            description: existing.description,
            sort: existing.sort,
          },
          after: {
            code: role.code,
            name: role.name,
            description: role.description,
            sort: role.sort,
          },
        })
        return formatRole(role)
      }

      const dup = await ctx.prisma.role.findUnique({ where: { code: data.code } })
      if (dup) throw new Error('角色编码已存在')

      const role = await ctx.prisma.role.create({
        data: { ...data, system: false, sort: data.sort ?? 99 } as never,
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
      })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'ROLE',
        summary: `创建角色 ${role.name}`,
        targetId: role.id,
        targetLabel: role.code,
      })
      return formatRole(role)
    },
  }),
)

builder.mutationField('setRolePermissions', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { systemWrite: true },
    args: { input: t.arg({ type: SetRolePermissionsInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const role = await ctx.prisma.role.findUnique({ where: { id: input.roleId } })
      if (!role) throw new Error('角色不存在')
      if (role.code === 'ADMIN') throw new Error('管理员角色拥有全部权限，不可修改')

      const beforeRole = await ctx.prisma.role.findUniqueOrThrow({
        where: { id: input.roleId },
        include: { permissions: { include: { permission: true } } },
      })
      const beforePerms = beforeRole.permissions.map((p) => p.permission.name).sort().join('、')

      await ctx.prisma.$transaction([
        ctx.prisma.rolePermission.deleteMany({ where: { roleId: input.roleId } }),
        ctx.prisma.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({
            roleId: input.roleId,
            permissionId,
          })),
        }),
      ])

      const updated = await ctx.prisma.role.findUniqueOrThrow({
        where: { id: input.roleId },
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
      })
      const afterPerms = updated.permissions.map((p) => p.permission.name).sort().join('、')
      await writeSystemLog(ctx, {
        action: 'UPDATE',
        module: 'ROLE',
        summary: `配置角色 ${updated.name} 权限（${input.permissionIds.length} 项）`,
        targetId: updated.id,
        targetLabel: updated.code,
        before: { permissions: beforePerms || '—' },
        after: { permissions: afterPerms || '—' },
      })
      return formatRole(updated)
    },
  }),
)

builder.mutationField('deleteRole', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { systemWrite: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.id },
        include: { _count: { select: { users: true } } },
      })
      if (!role) throw new Error('角色不存在')
      if (role.system) throw new Error('内置角色不可删除')
      if (role._count.users > 0) throw new Error('该角色下仍有用户，请先调整用户角色')

      await ctx.prisma.role.delete({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'DELETE',
        module: 'ROLE',
        summary: `删除角色 ${role.name}`,
        targetId: role.id,
        targetLabel: role.code,
      })
      return { ok: true }
    },
  }),
)
