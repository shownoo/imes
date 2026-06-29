/**
 * Fix JSX broken by i18n codemod revert: restore text children and onClick handlers.
 */
import fs from 'fs'
import path from 'path'

const files = [
  'components/qr-label-dialog.tsx',
  'components/qr-label.tsx',
  'components/qr-scanner-dialog.tsx',
  'components/settings-menu.tsx',
  'components/template-load-builtin.tsx',
  'pages/Dashboard.tsx',
  'pages/Login.tsx',
  'pages/SystemLogs.tsx',
  'pages/admin/print-templates/edit.tsx',
  'pages/admin/roles/role-form.tsx',
  'pages/admin/users/user-form.tsx',
  'pages/inbound/create.tsx',
  'pages/materials/category-form.tsx',
  'pages/materials/material-form.tsx',
  'pages/materials/supplier-form.tsx',
  'pages/outbound/detail.tsx',
  'pages/warehouses/shelf-form.tsx',
  'pages/warehouses/warehouse-form.tsx',
]

const root = path.resolve('web/src')

function fix(src) {
  // onClick={() =>'navigate('/path')}>取消' -> onClick={() => navigate('/path')}>取消
  src = src.replace(
    /onClick=\{\(\) =>'navigate\(([^)]+)\)>([^']+)'/g,
    "onClick={() => navigate($1)}>$2",
  )
  // onClick={() =>'history.back()'>取消' -> onClick={() => history.back()}>取消
  src = src.replace(
    /onClick=\{\(\) =>'([^']+)'>([^']+)'/g,
    "onClick={() => $1}>$2",
  )
  // >'保存'</Button> -> >保存</Button>
  src = src.replace(/>([^<{]+)'([^']+)'</g, (m, before, text) => {
    if (before.includes("'")) return m
    return `>${before}${text}<`
  })
  // standalone >'text'< 
  src = src.replace(/>'([^']+)'</g, ">$1<")
  // {'text'} in wrong places - leave label='x' as is
  return src
}

for (const f of files) {
  const p = path.join(root, f)
  const orig = fs.readFileSync(p, 'utf8')
  const fixed = fix(orig)
  if (fixed !== orig) {
    fs.writeFileSync(p, fixed)
    console.log('fixed:', f)
  }
}
