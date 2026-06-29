import { builder } from '../builder.js'
import { containsI } from '../lib/utils.js'
import { writeSystemLog } from '../lib/system-log.js'
import { IdInput, PaginationInput } from './input-types.js'

const AddSupplierInput = builder.inputType('AddSupplierInput', {
  fields: (t) => ({
    id: t.id({ required: false }),
    code: t.string({ required: true }),
    name: t.string({ required: true }),
    contact: t.string({ required: false }),
    phone: t.string({ required: false }),
    address: t.string({ required: false }),
    license: t.string({ required: false }),
  }),
})

builder.queryField('getSuppliers', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: PaginationInput, required: false }) },
    resolve: async (_, { input }, ctx) => {
      const { search, take, skip } = input ?? {}
      const where = search ? { OR: [{ name: containsI(search) }, { code: containsI(search) }] } : {}
      const [suppliers, count] = await Promise.all([
        ctx.prisma.supplier.findMany({ where, take: take ?? 50, skip: skip ?? 0 }),
        ctx.prisma.supplier.count({ where }),
      ])
      return { suppliers, count }
    },
  }),
)

builder.mutationField('addSupplier', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: AddSupplierInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { id, ...data } = input
      if (id) {
        const existing = await ctx.prisma.supplier.findUniqueOrThrow({ where: { id } })
        const result = await ctx.prisma.supplier.update({ where: { id }, data: data as never })
        await writeSystemLog(ctx, {
          action: 'UPDATE',
          module: 'SUPPLIER',
          summary: `更新供应商「${result.name}」`,
          targetId: result.id,
          targetLabel: result.code,
          before: existing as unknown as Record<string, unknown>,
          after: result as unknown as Record<string, unknown>,
        })
        return result
      }
      const result = await ctx.prisma.supplier.create({ data: data as never })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'SUPPLIER',
        summary: `新增供应商「${result.name}」`,
        targetId: result.id,
        targetLabel: result.code,
        after: result as unknown as Record<string, unknown>,
      })
      return result
    },
  }),
)

builder.mutationField('delSupplier', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const supplier = await ctx.prisma.supplier.findUniqueOrThrow({ where: { id: input.id } })
      const result = await ctx.prisma.supplier.delete({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'DELETE',
        module: 'SUPPLIER',
        summary: `删除供应商「${supplier.name}」`,
        targetId: supplier.id,
        targetLabel: supplier.code,
        before: supplier as unknown as Record<string, unknown>,
      })
      return result
    },
  }),
)
