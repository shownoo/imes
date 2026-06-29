export function containsI(search: string) {
  return { contains: search, mode: 'insensitive' as const }
}

export function genOrderNo(prefix: string) {
  const d = new Date()
  const date = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix}${date}${seq}`
}

export function genQrCode(materialCode: string, batchNo: string, seq: number) {
  return `${materialCode}-${batchNo}-${String(seq).padStart(3, '0')}`
}

export function calcExpiryLevel(expiryDate: Date): 'GREEN' | 'YELLOW' | 'RED' {
  const now = new Date()
  const diffMs = expiryDate.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 0) return 'RED'
  if (diffDays <= 30) return 'RED'
  if (diffDays <= 90) return 'YELLOW'
  return 'GREEN'
}

export function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}
