import { builder } from '../builder.js'
import { containsI } from '../lib/utils.js'
import { writeSystemLog } from '../lib/system-log.js'
import {
  enrichMaterial,
  materialListInclude,
  materialWithImagesInclude,
  snapMaterialForLog,
  syncMaterialImages,
} from '../lib/material-images.js'
import { IdInput, PaginationInput } from './input-types.js'

const AddMaterialInput = builder.inputType('AddMaterialInput', {
  fields: (t) => ({
    id: t.id({ required: false }),
    code: t.string({ required: true }),
    name: t.string({ required: true }),
    spec: t.string({ required: false }),
    model: t.string({ required: false }),
    unit: t.string({ required: false }),
    manufacturer: t.string({ required: false }),
    categoryId: t.id({ required: true }),
    supplierId: t.id({ required: false }),
    imageFileIds: t.stringList({ required: false }),
  }),
})

builder.queryField('getMaterials', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: PaginationInput, required: false }) },
    resolve: async (_, { input }, ctx) => {
      const { search, take, skip } = input ?? {}
      const where = search
        ? { OR: [{ name: containsI(search) }, { code: containsI(search) }] }
        : {}
      const [materials, count] = await Promise.all([
        ctx.prisma.material.findMany({
          where,
          take: take ?? 50,
          skip: skip ?? 0,
          include: materialListInclude,
          orderBy: { code: 'asc' },
        }),
        ctx.prisma.material.count({ where }),
      ])
      return { materials: materials.map(enrichMaterial), count }
    },
  }),
)

builder.queryField('getMaterial', (t) =>
  t.field({
    type: 'JSON',
    nullable: true,
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const material = await ctx.prisma.material.findUnique({
        where: { id: input.id },
        include: {
          ...materialWithImagesInclude,
          batches: { orderBy: { productionDate: 'desc' }, take: 20 },
          stockItems: { where: { status: 'IN_STOCK' }, include: { batch: true, shelf: true } },
        },
      })
      return material ? enrichMaterial(material) : null
    },
  }),
)

builder.queryField('traceMaterial', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { qrCode: t.arg.string({ required: true }) },
    resolve: async (_, { qrCode }, ctx) => {
      const item = await ctx.prisma.stockItem.findUnique({
        where: { qrCode },
        include: {
          material: { include: { category: true, supplier: true } },
          batch: { include: { supplier: true, inboundOrder: true } },
          shelf: { include: { warehouse: true } },
          movements: { orderBy: { createdAt: 'desc' }, include: { operator: true } },
        },
      })
      return item
    },
  }),
)

builder.mutationField('addMaterial', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: AddMaterialInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { id, imageFileIds, ...data } = input
      if (id) {
        const existing = await ctx.prisma.material.findUniqueOrThrow({
          where: { id },
          include: materialWithImagesInclude,
        })
        const result = await ctx.prisma.material.update({ where: { id }, data: data as never })
        await syncMaterialImages(ctx.prisma, id, imageFileIds)
        const enriched = await ctx.prisma.material.findUniqueOrThrow({
          where: { id },
          include: materialWithImagesInclude,
        })
        const beforeSnap = snapMaterialForLog(enrichMaterial(existing))
        const afterSnap = snapMaterialForLog(enrichMaterial(enriched))
        await writeSystemLog(ctx, {
          action: 'UPDATE',
          module: 'MATERIAL',
          summary: `更新物资「${result.name}」`,
          targetId: result.id,
          targetLabel: result.code,
          before: beforeSnap,
          after: afterSnap,
        })
        return enrichMaterial(enriched)
      }
      const result = await ctx.prisma.material.create({ data: data as never })
      await syncMaterialImages(ctx.prisma, result.id, imageFileIds ?? [])
      const enriched = await ctx.prisma.material.findUniqueOrThrow({
        where: { id: result.id },
        include: materialWithImagesInclude,
      })
      await writeSystemLog(ctx, {
        action: 'CREATE',
        module: 'MATERIAL',
        summary: `新增物资「${result.name}」`,
        targetId: result.id,
        targetLabel: result.code,
        after: snapMaterialForLog(enrichMaterial(enriched)),
      })
      return enrichMaterial(enriched)
    },
  }),
)

builder.mutationField('delMaterial', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: IdInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const material = await ctx.prisma.material.findUniqueOrThrow({ where: { id: input.id } })
      const result = await ctx.prisma.material.delete({ where: { id: input.id } })
      await writeSystemLog(ctx, {
        action: 'DELETE',
        module: 'MATERIAL',
        summary: `删除物资「${material.name}」`,
        targetId: material.id,
        targetLabel: material.code,
        before: material as unknown as Record<string, unknown>,
      })
      return result
    },
  }),
)
