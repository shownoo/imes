type MaterialRow = {
  id: string
  code: string
  name: string
  spec?: string | null
  model?: string | null
  unit?: string | null
  manufacturer?: string | null
}

export type ParsedInboundLine = {
  materialId: string | null
  expectedQty: number
  hint: string
  matchedBy?: 'code' | 'name' | 'spec' | 'model'
}

const HEADER_RE = /序号|编码|物资|名称|规格|型号|单位|数量|厂家|大类|备注|合计|小计/i
const QTY_RE = /(\d+(?:\.\d+)?)\s*(?:件|个|箱|套|台|把|张|条|吨|kg|KG|千克)?\s*$/
const UNIT_SUFFIX_RE = /(?:件|个|箱|套|台|把|张|条|吨|kg|KG|千克)$/i

function normalizeLine(line: string) {
  return line.replace(/\t+/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

function extractQty(parts: string[]): { qty: number; tokens: string[] } | null {
  if (parts.length === 0) return null

  const last = parts[parts.length - 1]
  const qtyMatch = last.match(QTY_RE)
  if (qtyMatch) {
    const qty = Number(qtyMatch[1])
    if (qty > 0) {
      return { qty, tokens: parts.slice(0, -1) }
    }
  }

  const numericOnly = parts.findIndex((p, i) => i > 0 && /^\d+(?:\.\d+)?$/.test(p))
  if (numericOnly > 0) {
    const qty = Number(parts[numericOnly])
    if (qty > 0) {
      const tokens = [...parts.slice(0, numericOnly), ...parts.slice(numericOnly + 1)]
      return { qty, tokens }
    }
  }

  return null
}

function scoreMaterial(material: MaterialRow, token: string): { score: number; by: ParsedInboundLine['matchedBy'] } {
  const t = token.trim()
  if (!t) return { score: 0, by: undefined }

  const code = material.code.toLowerCase()
  const name = material.name.toLowerCase()
  const spec = (material.spec ?? '').toLowerCase()
  const model = (material.model ?? '').toLowerCase()
  const lower = t.toLowerCase()

  if (code === lower) return { score: 100, by: 'code' }
  if (code.includes(lower) || lower.includes(code)) return { score: 80, by: 'code' }
  if (name === lower) return { score: 90, by: 'name' }
  if (name.includes(lower) || lower.includes(name)) return { score: 70, by: 'name' }
  if (spec && (spec.includes(lower) || lower.includes(spec))) return { score: 55, by: 'spec' }
  if (model && (model.includes(lower) || lower.includes(model))) return { score: 50, by: 'model' }

  return { score: 0, by: undefined }
}

function matchMaterial(materials: MaterialRow[], tokens: string[]): ParsedInboundLine | null {
  const hint = tokens.join(' ').replace(UNIT_SUFFIX_RE, '').trim()
  if (!hint) return null

  let best: { material: MaterialRow; score: number; by: ParsedInboundLine['matchedBy'] } | null = null

  for (const token of tokens) {
    if (!token || /^\d+(?:\.\d+)?$/.test(token)) continue
    for (const material of materials) {
      const { score, by } = scoreMaterial(material, token)
      if (score > (best?.score ?? 0)) {
        best = { material, score, by }
      }
    }
  }

  if (!best || best.score < 50) {
    for (const material of materials) {
      const { score, by } = scoreMaterial(material, hint)
      if (score > (best?.score ?? 0)) {
        best = { material, score, by }
      }
    }
  }

  if (!best || best.score < 50) return null

  return {
    materialId: best.material.id,
    expectedQty: 0,
    hint,
    matchedBy: best.by,
  }
}

export function parseInboundText(text: string, materials: MaterialRow[]): ParsedInboundLine[] {
  const rows: ParsedInboundLine[] = []
  const lines = text.split(/\r?\n/).map(normalizeLine).filter(Boolean)

  for (const line of lines) {
    if (HEADER_RE.test(line) && !/\d/.test(line)) continue
    if (/^[-=]{3,}$/.test(line)) continue

    const parts = line.split(/[,，;；|]/).length > 1
      ? line.split(/[,，;；|]/).map((p) => p.trim()).filter(Boolean)
      : line.split(/\s+/).filter(Boolean)

    const extracted = extractQty(parts)
    if (!extracted) continue

    const matched = matchMaterial(materials, extracted.tokens)
    if (matched) {
      rows.push({ ...matched, expectedQty: extracted.qty })
      continue
    }

    const hint = extracted.tokens.join(' ').trim()
    if (hint) {
      rows.push({ materialId: null, expectedQty: extracted.qty, hint })
    }
  }

  return rows
}
