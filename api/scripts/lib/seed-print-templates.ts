import type { PrismaClient } from '@prisma/client'
import { PRINT_TEMPLATE_HTML } from '../../src/lib/print-template-builtin.js'

export type SeedPrintTemplatesOptions = {
  keys?: string[]
}

/** Seed print templates into SystemSetting. Returns number of templates written. */
export async function seedPrintTemplates(
  prisma: PrismaClient,
  options: SeedPrintTemplatesOptions = {},
): Promise<number> {
  const keyFilter = options.keys ? new Set(options.keys) : null
  let count = 0

  for (const [key, { html }] of Object.entries(PRINT_TEMPLATE_HTML)) {
    if (keyFilter && !keyFilter.has(key)) continue

    const existing = await prisma.systemSetting.findFirst({ where: { key } })
    const value = { html }

    if (existing) {
      await prisma.systemSetting.update({
        where: { id: existing.id },
        data: { value },
      })
    } else {
      await prisma.systemSetting.create({
        data: { key, type: 'json', value },
      })
    }
    count++
  }

  return count
}
