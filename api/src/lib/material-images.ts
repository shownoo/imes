import type { Prisma, PrismaClient } from '@prisma/client'
import { getFilePublicUrl } from './uploadCapability.js'

const imageInclude = {
  images: {
    orderBy: { sortOrder: 'asc' as const },
    include: { file: true },
  },
} satisfies Prisma.MaterialInclude

export const materialWithImagesInclude = {
  category: true,
  supplier: true,
  ...imageInclude,
} satisfies Prisma.MaterialInclude

export const materialListInclude = {
  category: true,
  supplier: true,
  images: {
    take: 9,
    orderBy: { sortOrder: 'asc' as const },
    include: { file: true },
  },
  _count: {
    select: { images: true },
  },
} satisfies Prisma.MaterialInclude

type FileRow = {
  key: string
  storageType: string
  [key: string]: unknown
}

export function enrichFile(file: FileRow) {
  return { ...file, url: getFilePublicUrl(file.key, file.storageType) }
}

export function snapMaterialForLog(material: {
  code: string
  name: string
  spec?: string | null
  model?: string | null
  unit?: string | null
  manufacturer?: string | null
  category?: { code: string; name: string } | null
  supplier?: { code: string; name: string } | null
  images?: Array<{ file?: { name?: string } }>
}) {
  return {
    code: material.code,
    name: material.name,
    spec: material.spec,
    model: material.model,
    unit: material.unit,
    manufacturer: material.manufacturer,
    category: material.category ? `${material.category.code} ${material.category.name}` : '—',
    supplier: material.supplier ? `${material.supplier.code} ${material.supplier.name}` : '—',
    images: material.images?.length
      ? material.images.map((img) => img.file?.name ?? '未知文件').join('、')
      : '—',
  }
}

export function enrichMaterial<T extends { images?: Array<{ file: FileRow }> }>(material: T) {
  if (!material.images?.length) return material
  return {
    ...material,
    images: material.images.map((img) => ({
      ...img,
      file: enrichFile(img.file),
    })),
  }
}

export async function syncMaterialImages(
  prisma: PrismaClient,
  materialId: string,
  imageFileIds: string[] | null | undefined,
) {
  if (imageFileIds === undefined) return

  const ids = imageFileIds ?? []
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length !== ids.length) {
    throw new Error('material.images.duplicate')
  }

  if (uniqueIds.length > 0) {
    const files = await prisma.fileItem.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, mimeType: true },
    })
    if (files.length !== uniqueIds.length) {
      throw new Error('material.images.invalidFile')
    }
    const invalid = files.some((f) => f.mimeType && !f.mimeType.startsWith('image/'))
    if (invalid) {
      throw new Error('material.images.notImage')
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.materialImage.deleteMany({ where: { materialId } })
    if (uniqueIds.length > 0) {
      await tx.materialImage.createMany({
        data: uniqueIds.map((fileId, sortOrder) => ({
          materialId,
          fileId,
          sortOrder,
        })),
      })
    }
  })
}
