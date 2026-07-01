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
const skipDirs = new Set(['Editor', 'locales', 'node_modules', 'generated'])

const ATTRS = [
  'label',
  'title',
  'placeholder',
  'description',
  'alt',
  'aria-label',
  'backLabel',
  'emptyText',
  'confirmText',
  'cancelText',
  'tip',
  'message',
  'header',
  'subheader',
  'helperText',
]

const OBJ_KEYS = [
  'label',
  'title',
  'placeholder',
  'description',
  'tip',
  'message',
  'emptyText',
  'confirmText',
  'cancelText',
  'header',
  'subheader',
  'helperText',
  'backLabel',
  'shortLabel',
  'name',
]

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

function escapeForT(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function alreadyWrapped(src, pos) {
  const before = src.slice(Math.max(0, pos - 12), pos)
  return before.includes('t(') || before.includes('translate(')
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
      return `${attr}={t('${escapeForT(val)}')}`
    })
  }

  // key: '中文' or key: "中文" in object literals
  for (const key of OBJ_KEYS) {
    const reSingle = new RegExp(`(${key}:\\s*)'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)'`, 'g')
    src = src.replace(reSingle, (match, prefix, val, offset) => {
      if (!hasChinese(val)) return match
      if (alreadyWrapped(src, offset)) return match
      changed = true
      return `${prefix}t('${escapeForT(val)}')`
    })
    const reDouble = new RegExp(`(${key}:\\s*)"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`, 'g')
    src = src.replace(reDouble, (match, prefix, val, offset) => {
      if (!hasChinese(val)) return match
      if (alreadyWrapped(src, offset)) return match
      changed = true
      return `${prefix}t('${escapeForT(val)}')`
    })
  }

  // confirm('中文') / alert('中文')
  src = src.replace(/(confirm|alert|window\.confirm|window\.alert)\('([^']*[\u4e00-\u9fff][^']*)'\)/g, (_, fn, val) => {
    changed = true
    return `${fn}(t('${escapeForT(val)}'))`
  })

  // >中文</ -> >{t('中文')}<
  src = src.replace(/>([^<{][^<]*[\u4e00-\u9fff][^<]*)</g, (match, text) => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.includes('{') || trimmed.includes('t(')) return match
    if (trimmed.includes('<')) return match
    changed = true
    return `>{t('${escapeForT(trimmed)}')}<`
  })

  if (!changed) return false

  if (!src.includes('useTranslation')) {
    const importMatch = src.match(/^(import .+\n)+/)
    if (importMatch) {
      src = src.replace(importMatch[0], `${importMatch[0]}import { useTranslation } from 'react-i18next'\n`)
    } else {
      src = `import { useTranslation } from 'react-i18next'\n${src}`
    }
  }

  // inject const { t } = useTranslation() in exported function components
  if (!src.includes('const { t } = useTranslation()')) {
    src = src.replace(
      /export (?:default )?function (\w+)\([^)]*\)\s*\{/g,
      (m) => `${m}\n  const { t } = useTranslation()`,
    )
    src = src.replace(
      /export const (\w+) = \(\) => \{/g,
      (m) => `${m}\n  const { t } = useTranslation()`,
    )
    // function ComponentName() { at module level
    src = src.replace(
      /^function (\w+)\([^)]*\)\s*\{/gm,
      (m, name) => {
        if (['useTranslation'].includes(name)) return m
        return `${m}\n  const { t } = useTranslation()`
      },
    )
  }

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
