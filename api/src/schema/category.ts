import { builder } from '../builder.js'
import { containsI } from '../lib/utils.js'
import { writeSystemLog } from '../lib/system-log.js'
import { IdInput, PaginationInput } from './input-types.js'

const AddCategoryInput = builder.inputType('AddCategoryInput', {
  fields: (t) => ({
    id: t.id({ required: false }),
    code: t.string({ required: true }),
    name: t.string({ required: true }),
    zone: t.string({ required: false }),
    shelfLifeMonths: t.int({ required: false }),
    safetyStockMin: t.int({ required: false }),
    safetyStockMax: t.int({ required: false }),
    description: t.string({ required: false }),
  }),
})

builder.queryField('getCategories', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: PaginationInput, required: false }) },
    resolve: async (_, { input }, ctx) => {
      const { search, take, skip } = input ?? {}
      const where = search ? { OR: [{ name: containsI(search) }, { code: containsI(search) }] } : {}
      const [categories, count] = await Promise.all([
        ctx.prisma.materialCategory.findMany({ where, take: take ?? 50, skip: skip ?? 0, orderBy: { code: 'asc' } }),
        ctx.prisma.materialCategory.count({ where }),
      ])
      return { categories, count }
    },
  }),
)

builder.mutationField('addCategory', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: AddCategoryInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { id, ...data } = input
      if (id) {
        const existing = await ctx.prisma.materialCategory.findUniqueOrThrow({ where: { id } })
        const result = await ctx.prisma.materialCategory.update({ where: { id }, data: data as never })
        await writeSystemLog(ctx, {
          action: 'UPDATE',
          module: 'CATEGORY',
          summary: `更新物资分类「${result.name}」`,
          targetId: result.id,
          targetLabel: result.code,
          before: existing as unknown as Record<string, unknown>,
          after: result as unknown as Record<string, unknown>,
        })
        return result
      }
      const result = await ctx.prisma.materialCategory.create({ data: data as never })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'CATEGORY',
        summary: `新增物资分类「${result.name}」`,
        targetId: result.id,
        targetLabel: result.code,
        after: result as unknown as Record<string, unknown>,
      })
      return result
    },
  }),
)

builder.mutationField('delCategory', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const category = await ctx.prisma.materialCategory.findUniqueOrThrow({ where: { id: input.id } })
      const result = await ctx.prisma.materialCategory.delete({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'DELETE',
        module: 'CATEGORY',
        summary: `删除物资分类「${category.name}」`,
        targetId: category.id,
        targetLabel: category.code,
        before: category as unknown as Record<string, unknown>,
      })
      return result
    },
  }),
)
