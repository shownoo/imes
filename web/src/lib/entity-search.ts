import { pinyin } from 'pinyin-pro'

export type EntitySearchSource = Record<string, unknown>

export type EntitySearchItem = {
  id: string
  code: string
  name: string
  label: string
  pinyinFull: string
  pinyinAbbr: string
}

export function buildPinyinKeys(name: string) {
  const pinyinFull = pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase()
  const pinyinAbbr = pinyin(name, { pattern: 'first', toneType: 'none' }).replace(/\s/g, '').toLowerCase()
  return { pinyinFull, pinyinAbbr }
}

export function buildEntitySearchIndex(
  items: EntitySearchSource[],
  labelFn: (item: EntitySearchSource) => string,
): EntitySearchItem[] {
  return items.map((item) => {
    const code = String(item.code ?? '')
    const name = String(item.name ?? '')
    const { pinyinFull, pinyinAbbr } = buildPinyinKeys(name)
    return {
      id: String(item.id),
      code: code.toLowerCase(),
      name: name.toLowerCase(),
      label: labelFn(item),
      pinyinFull,
      pinyinAbbr,
    }
  })
}

/** 编码 / 名称 / 全拼 / 简拼 */
export function filterEntitySearch(items: EntitySearchItem[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (item) =>
      item.code.includes(q) ||
      item.name.includes(q) ||
      item.label.toLowerCase().includes(q) ||
      item.pinyinFull.includes(q) ||
      item.pinyinAbbr.includes(q),
  )
}
