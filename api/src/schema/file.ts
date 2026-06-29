import { StorageArea, StorageType } from '@prisma/client'
import { builder } from '../builder.js'
import { getFilePublicUrl } from '../lib/uploadCapability.js'

const StorageTypeEnum = builder.enumType(StorageType, { name: 'StorageType' })
const StorageAreaEnum = builder.enumType(StorageArea, { name: 'StorageArea' })

builder.prismaObject('FileItem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    size: t.exposeInt('size'),
    key: t.exposeString('key'),
    storageType: t.expose('storageType', { type: StorageTypeEnum }),
    area: t.expose('area', { type: StorageAreaEnum }),
    md5: t.exposeString('md5'),
    mimeType: t.exposeString('mimeType', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    url: t.string({
      resolve: (file) => getFilePublicUrl(file.key, file.storageType),
    }),
  }),
})

const FileInput = builder.inputType('FileInput', {
  fields: (t) => ({
    key: t.string({ required: true }),
    size: t.int({ required: true }),
    storageType: t.field({ type: StorageTypeEnum, required: true }),
    mime: t.string({ required: false }),
    area: t.field({ type: StorageAreaEnum, required: true }),
  }),
})

const RegisterFileInput = builder.inputType('RegisterFileInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    file: t.field({ type: FileInput, required: true }),
    md5: t.string({ required: true }),
  }),
})

const CheckFileDuplicateInput = builder.inputType('CheckFileDuplicateInput', {
  fields: (t) => ({
    md5: t.string({ required: true }),
  }),
})

const FileItemsInput = builder.inputType('FileItemsInput', {
  fields: (t) => ({
    ids: t.stringList({ required: true }),
  }),
})

const DeleteFileItemsInput = builder.inputType('DeleteFileItemsInput', {
  fields: (t) => ({
    ids: t.stringList({ required: true }),
  }),
})

builder.queryField('checkFileDuplicate', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: CheckFileDuplicateInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const file = await ctx.prisma.fileItem.findFirst({
        where: { md5: input.md5 },
      })
      if (!file) return { exist: false, fileItemId: null }
      return { exist: true, fileItemId: file.id }
    },
  }),
)

builder.queryField('fileItems', (t) =>
  t.prismaField({
    type: ['FileItem'],
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: FileItemsInput, required: true }) },
    resolve: async (query, _, { input }, ctx) =>
      ctx.prisma.fileItem.findMany({
        ...query,
        where: { id: { in: input.ids } },
      }),
  }),
)

builder.mutationField('registerFile', (t) =>
  t.prismaField({
    type: 'FileItem',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: RegisterFileInput, required: true }) },
    resolve: async (query, _, { input }, ctx) => {
      const existing = await ctx.prisma.fileItem.findFirst({
        where: {
          OR: [{ key: input.file.key }, { md5: input.md5 }],
        },
      })
      if (existing) return existing

      return ctx.prisma.fileItem.create({
        ...query,
        data: {
          name: input.name,
          key: input.file.key,
          size: input.file.size,
          storageType: input.file.storageType,
          mimeType: input.file.mime,
          area: input.file.area,
          md5: input.md5,
        },
      })
    },
  }),
)

builder.mutationField('deleteFileItems', (t) =>
  t.field({
    type: 'Int',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: DeleteFileItemsInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { count } = await ctx.prisma.fileItem.deleteMany({
        where: { id: { in: input.ids } },
      })
      return count
    },
  }),
)
