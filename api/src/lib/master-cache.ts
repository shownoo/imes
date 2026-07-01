import { CACHE_PREFIX, cacheInvalidatePrefix, cacheKey, cacheKeyHash } from './cache.js'

const NS = {
  material: `${CACHE_PREFIX}:material`,
  category: `${CACHE_PREFIX}:category`,
  supplier: `${CACHE_PREFIX}:supplier`,
  warehouse: `${CACHE_PREFIX}:warehouse`,
  shelf: `${CACHE_PREFIX}:shelf`,
  outboundDest: `${CACHE_PREFIX}:outbound-dest`,
  outboundPurpose: `${CACHE_PREFIX}:outbound-purpose`,
  org: `${CACHE_PREFIX}:org`,
} as const

export function materialListKey(input: unknown) {
  return cacheKey(NS.material, 'list', cacheKeyHash(input))
}

export function materialIndexKey() {
  return cacheKey(NS.material, 'index')
}

export function categoryListKey(input: unknown) {
  return cacheKey(NS.category, 'list', cacheKeyHash(input))
}

export function supplierListKey(input: unknown) {
  return cacheKey(NS.supplier, 'list', cacheKeyHash(input))
}

export function warehouseAllKey() {
  return cacheKey(NS.warehouse, 'all')
}

export function shelfListKey(input: unknown) {
  return cacheKey(NS.shelf, 'list', cacheKeyHash(input))
}

export function outboundDestListKey(input: unknown) {
  return cacheKey(NS.outboundDest, 'list', cacheKeyHash(input))
}

export function outboundPurposeListKey(input: unknown) {
  return cacheKey(NS.outboundPurpose, 'list', cacheKeyHash(input))
}

export function orgCityKey() {
  return cacheKey(NS.org, 'city')
}

export function orgLicenseeKey() {
  return cacheKey(NS.org, 'licensee')
}

export async function invalidateMaterialCache() {
  await cacheInvalidatePrefix(NS.material)
}

export async function invalidateCategoryCache() {
  await Promise.all([cacheInvalidatePrefix(NS.category), invalidateMaterialCache()])
}

export async function invalidateSupplierCache() {
  await Promise.all([cacheInvalidatePrefix(NS.supplier), invalidateMaterialCache()])
}

export async function invalidateWarehouseCache() {
  await Promise.all([cacheInvalidatePrefix(NS.warehouse), cacheInvalidatePrefix(NS.shelf)])
}

export async function invalidateShelfCache() {
  await Promise.all([cacheInvalidatePrefix(NS.shelf), cacheInvalidatePrefix(NS.warehouse)])
}

export async function invalidateOutboundDestCache() {
  await cacheInvalidatePrefix(NS.outboundDest)
}

export async function invalidateOutboundPurposeCache() {
  await cacheInvalidatePrefix(NS.outboundPurpose)
}

export async function invalidateOrgCache() {
  await Promise.all([
    cacheInvalidatePrefix(NS.org),
    invalidateOutboundDestCache(),
  ])
}
