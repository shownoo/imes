function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const result = path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part]
    return undefined
  }, obj)
  return result != null ? String(result) : ''
}

export function replaceTemplateVariables(
  html: string,
  data: Record<string, unknown>,
): string {
  if (!html || !data) return html

  let processed = html
  const items = (data.items as Record<string, unknown>[]) ?? []

  if (Array.isArray(items) && items.length > 0) {
    processed = processed.replace(
      /(<tr[^>]*>(?:(?!<\/tr>)[\s\S])*?<span[^>]*data-variable="t-[^"]*"[^>]*>[\s\S]*?<\/tr>)/g,
      (templateRow) => {
        return items
          .map((item, index) => {
            let row = templateRow
            row = row.replace(
              /<span[^>]*class="template-variable"[^>]*data-variable="(t-[^"]*)"[^>]*>.*?<\/span>/g,
              (_m, varName: string) => {
                const field = varName.substring(2)
                if (field === 'odr') return String(index + 1)
                const val = item[field]
                return val != null ? String(val) : ''
              },
            )
            row = row.replace(
              /<span[^>]*class="template-variable"[^>]*data-variable="(m-[^"]*)"[^>]*>.*?<\/span>/g,
              (_m, varName: string) => {
                const field = varName.substring(2)
                return getNestedValue(data, field)
              },
            )
            return row
          })
          .join('')
      },
    )
  }

  processed = processed.replace(
    /<span[^>]*class="template-variable"[^>]*data-variable="(m-[^"]*)"[^>]*>.*?<\/span>/g,
    (_match, variableName: string) => {
      const field = variableName.substring(2)
      return getNestedValue(data, field)
    },
  )

  return processed
}

export function wrapPrintHtml(bodyContent: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif;
    font-size: 14px;
    line-height: 1.8;
    color: #000;
    padding: 40px;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; font-size: 12px; }
  th { background-color: #f5f5f5; font-weight: bold; }
  p { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
  h2 { margin-bottom: 8px; }
  @media print {
    body { padding: 0; }
    @page { margin: 15mm; size: A4; }
  }
</style>
</head>
<body>${bodyContent}</body>
</html>`
}
