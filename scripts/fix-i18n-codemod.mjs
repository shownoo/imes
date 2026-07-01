/**
 * Repair i18n-codemod breakage: imports, type defs, onClick handlers.
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const root = path.resolve('web/src')

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== 'locales') walk(p, files)
    } else if (/\.tsx$/.test(f)) files.push(p)
  }
  return files
}

function fixImports(src) {
  if (!src.includes("import { useTranslation }")) return src
  // Remove misplaced useTranslation inside import blocks
  src = src.replace(/import \{\nimport \{ useTranslation \} from 'react-i18next'\n/g, 'import {\n')
  // Dedupe
  const lines = src.split('\n')
  let seen = false
  const out = []
  for (const line of lines) {
    if (line === "import { useTranslation } from 'react-i18next'") {
      if (seen) continue
      seen = true
    }
    out.push(line)
  }
  src = out.join('\n')
  // Ensure import exists if t() is used
  if (src.includes('useTranslation()') && !src.includes("import { useTranslation }")) {
    const m = src.match(/^(import .+\n)+/)
    if (m) src = src.replace(m[0], `${m[0]}import { useTranslation } from 'react-i18next'\n`)
  }
  return src
}

function fixTypeCorruption(src) {
  // columns: ColumnDef<TData, TValue>{t('[] -> ][]
  src = src.replace(/ColumnDef<TData, TValue>\{t\('\[\]/g, 'ColumnDef<TData, TValue>[]')
  // pagination?: Omit')}<DataTablePaginationProps -> pagination?: Omit<DataTablePaginationProps
  src = src.replace(/Omit'\)\}<\s*DataTablePaginationProps/g, 'Omit<DataTablePaginationProps')
  return src
}

function fixOnClick(src) {
  return src.replace(
    /onClick=\{\(\) =>\{t\('((?:\\'|[^'])*)>\s*((?:\\'|[^'])*)'\)\}/g,
    (_, body, text) => `onClick={() => ${body.replace(/\\'/g, "'")}}>${text.replace(/\\'/g, "'")}`,
  )
}

function fixBrokenExpressions(src) {
  src = src.replace(/>\{t\('(\d+)/g, '> $1')
  src = src.replace(/\\'/g, "'")
  src = src.replace(/\)\}'\)< /g, ') < ')
  src = src.replace(/\)\}'\)> /g, ') > ')
  return src
}

function fix(file) {
  let src = fs.readFileSync(file, 'utf8')
  const orig = src
  src = fixImports(src)
  src = fixTypeCorruption(src)
  src = fixOnClick(src)
  src = fixBrokenExpressions(src)
  if (src !== orig) {
    fs.writeFileSync(file, src)
    return true
  }
  return false
}

let n = 0
for (const f of walk(root)) {
  if (fix(f)) {
    n++
    console.log('fixed:', path.relative(root, f))
  }
}

// Restore data-table from git if still broken
const dt = path.join(root, 'components/data-table/data-table.tsx')
const dtSrc = fs.readFileSync(dt, 'utf8')
if (dtSrc.includes("{t('")) {
  try {
    const orig = execSync('git show HEAD:web/src/components/data-table/data-table.tsx', { cwd: path.resolve('..') }).toString()
    fs.writeFileSync(dt, orig)
    console.log('restored: components/data-table/data-table.tsx from HEAD')
  } catch { /* new file */ }
}

console.log(`Fixed ${n} files`)
