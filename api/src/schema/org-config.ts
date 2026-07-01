import { builder } from '../builder.js'
import { readOrgCity, readOrgLicensee, writeOrgCity, writeOrgLicensee } from '../lib/org-config.js'
import { writeSystemLog } from '../lib/system-log.js'

const SetOrgCityInput = builder.inputType('SetOrgCityInput', {
  fields: (t) => ({
    city: t.string({ required: true }),
  }),
})

const SetOrgLicenseeInput = builder.inputType('SetOrgLicenseeInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
  }),
})

builder.queryField('getOrgCity', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    resolve: async (_, __, ctx) => ({ city: await readOrgCity(ctx.prisma) }),
  }),
)

builder.queryField('getOrgLicensee', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    resolve: async (_, __, ctx) => ({ name: await readOrgLicensee(ctx.prisma) }),
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

builder.mutationField('setOrgLicensee', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: SetOrgLicenseeInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const before = await readOrgLicensee(ctx.prisma)
      const name = await writeOrgLicensee(ctx.prisma, input.name)
      await writeSystemLog(ctx, {
        action: 'UPDATE',
        module: 'USER',
        summary: `更新授权单位为「${name}」`,
        targetLabel: ORG_LICENSEE_LABEL,
        before: { name: before },
        after: { name },
      })
      return { name }
    },
  }),
)

const ORG_CITY_LABEL = 'org_city'
const ORG_LICENSEE_LABEL = 'org_licensee'
