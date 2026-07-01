import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootPkgPath = resolve(__dirname, '../../package.json')
const outDir = resolve(__dirname, '../src/generated')
const outFile = resolve(outDir, 'build-info.ts')

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatBuildId(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`
}

const pkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'))
const semver = pkg.version ?? '0.0.0'
const buildTime = new Date()
const buildId = formatBuildId(buildTime)
const buildVersion = `${semver}+${buildId}`
/** URL 安全，供 Vite 静态资源目录使用（对齐 neoWebSchool 打包目录 + 版本号） */
const assetRelease = `${semver}-${buildId}`

const source = `/**
 * 构建时由 scripts/inject-version.mjs 自动生成，请勿手动编辑。
 */
export const BUILD_SEMVER = ${JSON.stringify(semver)}
export const BUILD_ID = ${JSON.stringify(buildId)}
export const BUILD_VERSION = ${JSON.stringify(buildVersion)}
export const BUILD_ASSET_RELEASE = ${JSON.stringify(assetRelease)}
export const BUILD_TIME = ${JSON.stringify(buildTime.toISOString())}
`

const metaFile = resolve(outDir, 'build-meta.json')
const meta = { semver, buildId, buildVersion, assetRelease, buildTime: buildTime.toISOString() }

mkdirSync(outDir, { recursive: true })
writeFileSync(outFile, source, 'utf-8')
writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`, 'utf-8')
console.log(`[inject-version] ${buildVersion} (assets: imesassetsv2/${assetRelease}/)`)
