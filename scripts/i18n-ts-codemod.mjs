/**
 * Codemod: wrap Chinese string literals in .ts lib files with translate('…').
 * Skips comments, theme catalogs, and files already using translate at export.
 */
import fs from 'fs'
import path from 'path'

const root = path.resolve('web/src')
const SKIP_DIRS = new Set(['Editor', 'locales', 'node_modules', 'generated', 'pages', 'components', 'hooks', 'contexts'])
const SKIP_FILES = new Set([
  'cheta-kpi-institutional.ts',
  'leader-style-presets.ts',
  'ui-design-catalog.ts',
  'workspace-theme.ts',
  'city-districts.ts',
  'theme-customizer-surfaces.ts',
  'leader-fonts.ts',
  'leader-overview-skin.ts',
  'nav-styles.ts',
  'ui-design-tokens.ts',
  'print-variables.ts',
  'print-keys.ts',
  'order-status.ts',
  'movement-types.ts',
  'auth.ts',
])

function hasChinese(s) {
  return /[\u4e00-\u9fff]/.test(s)
}

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(f)) walk(p, files)
    } else if (/\.ts$/.test(f) && !SKIP_FILES.has(f)) {
      files.push(p)
    }
  }
  return files
}

function transform(file) {
  let src = fs.readFileSync(file, 'utf8')
  if (!hasChinese(src)) return false
  if (src.includes('useTranslation')) return false

  let changed = false
  const original = src

  // '中文' or "中文" in string literal positions (not already in translate/t)
  src = src.replace(/(?<![\w.])(?:translate|t)\(('[^']*[\u4e00-\u9fff][^']*'|"[^"]*[\u4e00-\u9fff][^"]*")\)/g, '$1')

  src = src.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match, val) => {
    if (!hasChinese(val)) return match
    if (match.includes('translate(')) return match
    changed = true
    return `translate('${val.replace(/'/g, "\\'")}')`
  })

  if (!changed) return false

  if (!src.includes("from 'locales'") && !src.includes('from "locales"')) {
    src = `import { translate } from 'locales'\n${src}`
  }

  if (src === original) return false
  fs.writeFileSync(file, src)
  return true
}

const files = walk(root)
let count = 0
for (const f of files) {
  if (transform(f)) {
    count++
    console.log('updated:', path.relative(root, f))
  }
}
console.log(`TS codemod updated ${count} files`)
