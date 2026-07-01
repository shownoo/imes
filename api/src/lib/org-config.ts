import { cacheDel, cached } from './cache.js'
import { invalidateOrgCache, orgCityKey, orgLicenseeKey } from './master-cache.js'

export const ORG_CITY_SETTING_KEY = 'org_city'
export const ORG_LICENSEE_SETTING_KEY = 'org_licensee'
export const DEFAULT_ORG_CITY = '武汉市'
/** 演示/未配置部署时的默认授权单位 */
export const DEFAULT_ORG_LICENSEE = '武汉市应急物资保障中心'

type OrgCityValue = { city?: string }
type OrgLicenseeValue = { name?: string }

export async function readOrgCity(
  prisma: { systemSetting: { findUnique: (args: { where: { key: string } }) => Promise<{ value: unknown } | null> } },
): Promise<string> {
  return cached(orgCityKey(), async () => {
    const row = await prisma.systemSetting.findUnique({ where: { key: ORG_CITY_SETTING_KEY } })
    const value = row?.value as OrgCityValue | null
    const city = value?.city?.trim()
    return city || DEFAULT_ORG_CITY
  })
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
  await invalidateOrgCache()
  return normalized
}

export async function readOrgLicensee(
  prisma: { systemSetting: { findUnique: (args: { where: { key: string } }) => Promise<{ value: unknown } | null> } },
): Promise<string> {
  return cached(orgLicenseeKey(), async () => {
    const row = await prisma.systemSetting.findUnique({ where: { key: ORG_LICENSEE_SETTING_KEY } })
    const value = row?.value as OrgLicenseeValue | null
    const name = value?.name?.trim()
    return name || process.env.ORG_LICENSEE?.trim() || DEFAULT_ORG_LICENSEE
  })
}

export async function writeOrgLicensee(
  prisma: { systemSetting: { upsert: (args: {
    where: { key: string }
    create: { key: string; value: { name: string } }
    update: { value: { name: string } }
  }) => Promise<unknown> } },
  name: string,
) {
  const normalized = name.trim()
  if (!normalized) throw new Error('请填写授权单位名称')
  await prisma.systemSetting.upsert({
    where: { key: ORG_LICENSEE_SETTING_KEY },
    create: { key: ORG_LICENSEE_SETTING_KEY, value: { name: normalized } },
    update: { value: { name: normalized } },
  })
  await cacheDel(orgLicenseeKey())
  return normalized
}

export function defaultDestinationName(district: string) {
  const d = district.trim()
  if (!d) return ''
  if (d.endsWith('应急保障局')) return d
  return `${d}应急保障局`
}
