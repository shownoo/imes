export function defaultDestinationName(district: string) {
  const d = district.trim()
  if (!d) return ''
  if (d.endsWith('应急保障局')) return d
  return `${d}应急保障局`
}
