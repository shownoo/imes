/**
 * Revert broken i18n codemod: remove useTranslation injections and restore Chinese literals.
 */
import fs from 'fs'
import path from 'path'

const root = path.resolve('web/src')

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'locales' && f !== 'Editor' && f !== 'node_modules') walk(p, files)
    } else if (/\.tsx$/.test(f)) {
      files.push(p)
    }
  }
  return files
}

function revert(file) {
  let src = fs.readFileSync(file, 'utf8')
  if (!src.includes('useTranslation')) return false

  // remove standalone import
  src = src.replace(/^import \{ useTranslation \} from 'react-i18next'\n/gm, '')

  // remove injected import inside other import blocks (broken)
  src = src.replace(/\nimport \{ useTranslation \} from 'react-i18next'\n/g, '\n')

  // remove const { t } = useTranslation()
  src = src.replace(/\n  const \{ t \} = useTranslation\(\)\n/g, '\n')

  // {t('text')} -> 'text' for attributes
  src = src.replace(/\{t\('((?:\\'|[^'])*)'\)\}/g, (_, s) => `'${s.replace(/\\'/g, "'")}'`)

  // >{t('text')}< -> >text<
  src = src.replace(/>\{t\('((?:\\'|[^'])*)'\)\}</g, (_, s) => `>${s.replace(/\\'/g, "'")}<`)

  // fix broken onClick patterns from codemod
  src = src.replace(
    /onClick=\{\(\) =>\{t\('navigate\(([^)]+)\)>取消'\)\}/g,
    "onClick={() => navigate($1)}>取消",
  )

  fs.writeFileSync(file, src)
  return true
}

const files = walk(root)
let n = 0
for (const f of files) {
  if (revert(f)) {
    n++
    console.log('reverted:', path.relative(root, f))
  }
}
console.log(`Reverted ${n} files`)
