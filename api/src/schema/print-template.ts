import { builder } from '../builder.js'
import { PRINT_TEMPLATE_HTML } from '../lib/print-template-builtin.js'

const GetPrintTemplateInput = builder.inputType('GetPrintTemplateInput', {
  fields: (t) => ({
    key: t.string({ required: true }),
  }),
})

const SetPrintTemplateInput = builder.inputType('SetPrintTemplateInput', {
  fields: (t) => ({
    key: t.string({ required: true }),
    template: t.field({ type: 'JSON', required: false }),
    html: t.string({ required: true }),
  }),
})

builder.queryField('getPrintTemplate', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: GetPrintTemplateInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const row = await ctx.prisma.systemSetting.findFirst({ where: { key: input.key } })
      if (!row) {
        const builtin = PRINT_TEMPLATE_HTML[input.key as keyof typeof PRINT_TEMPLATE_HTML]
        return builtin
          ? { key: input.key, value: { html: builtin.html }, html: builtin.html }
          : null
      }
      const value = row.value as { html?: string; template?: unknown } | null
      return {
        id: row.id,
        key: row.key,
        value,
        html: value?.html ?? null,
      }
    },
  }),
)

builder.queryField('getBuiltinPrintTemplate', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: GetPrintTemplateInput, required: true }) },
    resolve: (_, { input }) => {
      const row = PRINT_TEMPLATE_HTML[input.key as keyof typeof PRINT_TEMPLATE_HTML]
      return row ? { html: row.html } : null
    },
  }),
)

builder.mutationField('setPrintTemplate', (t) =>
  t.field({
    type: 'Int',
    authScopes: { admin: true },
    args: { input: t.arg({ type: SetPrintTemplateInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const { key, template, html } = input
      await ctx.prisma.systemSetting.upsert({
        where: { key },
        update: { value: { ...(template != null ? { template } : {}), html } },
        create: { key, value: { ...(template != null ? { template } : {}), html }, type: 'json' },
      })
      return 1
    },
  }),
)

builder.mutationField('resetPrintTemplate', (t) =>
  t.field({
    type: 'Int',
    authScopes: { admin: true },
    args: { input: t.arg({ type: GetPrintTemplateInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const builtin = PRINT_TEMPLATE_HTML[input.key as keyof typeof PRINT_TEMPLATE_HTML]
      if (!builtin) return 0
      await ctx.prisma.systemSetting.upsert({
        where: { key: input.key },
        update: { value: { html: builtin.html } },
        create: { key: input.key, value: { html: builtin.html }, type: 'json' },
      })
      return 1
    },
  }),
)
