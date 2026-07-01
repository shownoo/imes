import { builder } from '../builder.js'
import { readOrgCity, writeOrgCity } from '../lib/org-config.js'
import { writeSystemLog } from '../lib/system-log.js'

const SetOrgCityInput = builder.inputType('SetOrgCityInput', {
  fields: (t) => ({
    city: t.string({ required: true }),
  }),
})

builder.queryField('getOrgCity', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    resolve: async (_, __, ctx) => ({ city: await readOrgCity(ctx.prisma) }),
  }),
)

builder.mutationField('setOrgCity', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { supervisor: true },
    args: { input: t.arg({ type: SetOrgCityInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const before = await readOrgCity(ctx.prisma)
      const city = await writeOrgCity(ctx.prisma, input.city)
      await writeSystemLog(ctx, {
        action: 'UPDATE',
        module: 'OUTBOUND',
        summary: `更新系统所属市为「${city}」`,
        targetLabel: ORG_CITY_LABEL,
        before: { city: before },
        after: { city },
      })
      return { city }
    },
  }),
)

const ORG_CITY_LABEL = 'org_city'
