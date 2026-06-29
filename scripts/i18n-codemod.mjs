/**
 * Codemod: wrap common Chinese string patterns with t('…') and inject useTranslation.
 */
import fs from 'fs'
import path from 'path'

const root = path.resolve('web/src')
const skipFiles = new Set([
  'cheta-kpi-institutional.ts',
  'leader-style-presets.ts',
  'ui-design-catalog.ts',
  'workspace-theme.ts',
  'system-log-labels.ts',
  'print-variables.ts',
  'index.tsx', // locales
])
const skipDirs = new Set(['Editor', 'locales', 'node_modules'])

const ATTRS = ['label', 'title', 'placeholder', 'description', 'alt', 'aria-label', 'backLabel']

function hasChinese(s) {
  return /[\u4e00-\u9fff]/.test(s)
}

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) {
      if (!skipDirs.has(f)) walk(p, files)
    } else if (/\.tsx$/.test(f) && !skipFiles.has(f)) {
      files.push(p)
    }
  }
  return files
}

function transform(file) {
  let src = fs.readFileSync(file, 'utf8')
  if (!hasChinese(src)) return false

  let changed = false

  // attr="中文" -> attr={t('中文')}
  for (const attr of ATTRS) {
    const re = new RegExp(`${attr}="([^"]*[\u4e00-\u9fff][^"]*)"`, 'g')
    src = src.replace(re, (_, val) => {
      changed = true
      return `${attr}={t('${val.replace(/'/g, "\\'")}')}`
    })
  }

  // >中文</ -> >{t('中文')}<
  src = src.replace(/>([^<{][^<]*[\u4e00-\u9fff][^<]*)</g, (match, text) => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.includes('{') || trimmed.includes('t(')) return match
  // skip if contains other markup
    if (trimmed.includes('<')) return match
    changed = true
    return `>{t('${trimmed.replace(/'/g, "\\'")}')}<`
  })

  if (!changed) return false

  if (!src.includes('useTranslation')) {
    src = src.replace(
      /^(import .+\n)+/,
      (m) => `${m}import { useTranslation } from 'react-i18next'\n`,
    )
  }

  // inject const { t } = useTranslation() in exported function components
  src = src.replace(
    /export (?:default )?function (\w+)\([^)]*\)\s*\{/g,
    (m, name) => {
      if (src.includes('const { t } = useTranslation()')) return m
      return `${m}\n  const { t } = useTranslation()`
    },
  )

  // also for const X = () => {
  src = src.replace(
    /export const (\w+) = \(\) => \{/g,
    (m) => {
      if (src.includes('const { t } = useTranslation()')) return m
      return `${m}\n  const { t } = useTranslation()`
    },
  )

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
console.log(`Codemod updated ${count} files`)
