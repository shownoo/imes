export const ORG_CITY_SETTING_KEY = 'org_city'
export const DEFAULT_ORG_CITY = '武汉市'

type OrgCityValue = { city?: string }

export async function readOrgCity(
  prisma: { systemSetting: { findUnique: (args: { where: { key: string } }) => Promise<{ value: unknown } | null> } },
): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key: ORG_CITY_SETTING_KEY } })
  const value = row?.value as OrgCityValue | null
  const city = value?.city?.trim()
  return city || DEFAULT_ORG_CITY
}

export async function writeOrgCity(
  prisma: { systemSetting: { upsert: (args: {
    where: { key: string }
    create: { key: string; value: { city: string } }
    update: { value: { city: string } }
  }) => Promise<unknown> } },
  city: string,
) {
  const normalized = city.trim()
  if (!normalized) throw new Error('请填写所属市')
  await prisma.systemSetting.upsert({
    where: { key: ORG_CITY_SETTING_KEY },
    create: { key: ORG_CITY_SETTING_KEY, value: { city: normalized } },
    update: { value: { city: normalized } },
  })
  return normalized
}

export function defaultDestinationName(district: string) {
  const d = district.trim()
  if (!d) return ''
  if (d.endsWith('应急保障局')) return d
  return `${d}应急保障局`
}
