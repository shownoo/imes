/**
 * Extract Chinese UI strings from web/src for locale generation.
 * Collects t('…'), translate('…') keys and Chinese string literals.
 */
import fs from 'fs'
import path from 'path'

const root = path.resolve('web/src')
const outPath = path.resolve('scripts/.i18n-strings.json')

const SKIP_DIRS = new Set(['Editor', 'locales', 'node_modules', 'generated'])
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
])

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(f)) walk(p, files)
    } else if (/\.(tsx?|jsx?)$/.test(f) && !SKIP_FILES.has(f)) {
      files.push(p)
    }
  }
  return files
}

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function extractFromSource(src) {
  const strings = new Set()
  const clean = stripComments(src)

  // t('…') and translate('…')
  for (const m of clean.matchAll(/(?:t|translate)\('((?:\\'|[^'])*)'\)/g)) {
    strings.add(m[1].replace(/\\'/g, "'"))
  }
  for (const m of clean.matchAll(/(?:t|translate)\("((?:\\"|[^"])*)"\)/g)) {
    strings.add(m[1].replace(/\\"/g, '"'))
  }

  // Chinese string literals in single or double quotes
  for (const m of clean.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g)) {
    if (/[\u4e00-\u9fff]/.test(m[1])) strings.add(m[1])
  }
  for (const m of clean.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)) {
    if (/[\u4e00-\u9fff]/.test(m[1])) strings.add(m[1])
  }
  // Template literal segments with Chinese (static parts only)
  for (const m of clean.matchAll(/`([^`$\\]*(?:\\.[^`$\\]*)*)`/g)) {
    if (/[\u4e00-\u9fff]/.test(m[1])) strings.add(m[1].trim())
  }

  return strings
}

const all = new Set()
for (const f of walk(root)) {
  const src = fs.readFileSync(f, 'utf8')
  for (const s of extractFromSource(src)) all.add(s)
}

const sorted = [...all].sort()
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(sorted, null, 2) + '\n')
console.log(`Extracted ${sorted.length} strings → ${path.relative(process.cwd(), outPath)}`)
