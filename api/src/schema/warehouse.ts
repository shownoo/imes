import { builder } from '../builder.js'
import { writeSystemLog } from '../lib/system-log.js'
import { IdInput, PaginationInput } from './input-types.js'

const AddWarehouseInput = builder.inputType('AddWarehouseInput', {
  fields: (t) => ({
    id: t.id({ required: false }),
    code: t.string({ required: true }),
    name: t.string({ required: true }),
    zone: t.string({ required: false }),
    area: t.float({ required: false }),
    capacity: t.int({ required: false }),
  }),
})

const AddShelfInput = builder.inputType('AddShelfInput', {
  fields: (t) => ({
    id: t.id({ required: false }),
    code: t.string({ required: true }),
    name: t.string({ required: true }),
    zone: t.string({ required: true }),
    row: t.string({ required: false }),
    level: t.int({ required: false }),
    capacity: t.int({ required: false }),
    warehouseId: t.id({ required: true }),
  }),
})

builder.queryField('getWarehouses', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    resolve: async (_, __, ctx) => {
      const warehouses = await ctx.prisma.warehouse.findMany({
        include: { shelves: true },
        orderBy: { code: 'asc' },
      })
      return { warehouses, count: warehouses.length }
    },
  }),
)

builder.queryField('getShelves', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: {
      warehouseId: t.arg.id({ required: false }),
      input: t.arg({ type: PaginationInput, required: false }),
    },
    resolve: async (_, { warehouseId, input }, ctx) => {
      const where = warehouseId ? { warehouseId } : {}
      const [shelves, count] = await Promise.all([
        ctx.prisma.shelf.findMany({
          where,
          take: input?.take ?? 100,
          skip: input?.skip ?? 0,
          include: { warehouse: true, _count: { select: { stockItems: true } } },
          orderBy: { code: 'asc' },
        }),
        ctx.prisma.shelf.count({ where }),
      ])
      return { shelves, count }
    },
  }),
)

builder.mutationField('addWarehouse', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: AddWarehouseInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { id, ...data } = input
      if (id) {
        const existing = await ctx.prisma.warehouse.findUniqueOrThrow({ where: { id } })
        const result = await ctx.prisma.warehouse.update({ where: { id }, data: data as never })
        await writeSystemLog(ctx, {
          action: 'UPDATE',
          module: 'WAREHOUSE',
          summary: `更新库区「${result.name}」`,
          targetId: result.id,
          targetLabel: result.code,
          before: existing as unknown as Record<string, unknown>,
          after: result as unknown as Record<string, unknown>,
        })
        return result
      }
      const result = await ctx.prisma.warehouse.create({ data: data as never })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'WAREHOUSE',
        summary: `新增库区「${result.name}」`,
        targetId: result.id,
        targetLabel: result.code,
        after: result as unknown as Record<string, unknown>,
      })
      return result
    },
  }),
)

builder.mutationField('addShelf', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: AddShelfInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { id, ...data } = input
      const qrCode = `SHELF-${data.code}`
      if (id) {
        const existing = await ctx.prisma.shelf.findUniqueOrThrow({ where: { id } })
        const result = await ctx.prisma.shelf.update({ where: { id }, data: { ...data, qrCode } })
        await writeSystemLog(ctx, {
          action: 'UPDATE',
          module: 'WAREHOUSE',
          summary: `更新货位「${result.name}」`,
          targetId: result.id,
          targetLabel: result.code,
          before: existing as unknown as Record<string, unknown>,
          after: result as unknown as Record<string, unknown>,
        })
        return result
      }
      const result = await ctx.prisma.shelf.create({ data: { ...data, qrCode } as never })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'WAREHOUSE',
        summary: `新增货位「${result.name}」`,
        targetId: result.id,
        targetLabel: result.code,
        after: result as unknown as Record<string, unknown>,
      })
      return result
    },
  }),
)

builder.mutationField('delShelf', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const shelf = await ctx.prisma.shelf.findUniqueOrThrow({ where: { id: input.id } })
      const result = await ctx.prisma.shelf.delete({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'DELETE',
        module: 'WAREHOUSE',
        summary: `删除货位「${shelf.name}」`,
        targetId: shelf.id,
        targetLabel: shelf.code,
        before: shelf as unknown as Record<string, unknown>,
      })
      return result
    },
  }),
)

builder.mutationField('delWarehouse', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const warehouse = await ctx.prisma.warehouse.findUniqueOrThrow({ where: { id: input.id } })
      const result = await ctx.prisma.warehouse.delete({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'DELETE',
        module: 'WAREHOUSE',
        summary: `删除库区「${warehouse.name}」`,
        targetId: warehouse.id,
        targetLabel: warehouse.code,
        before: warehouse as unknown as Record<string, unknown>,
      })
      return result
    },
  }),
)
