import { translate } from 'locales'
/** 应用元信息（构建版本由 scripts/inject-version.mjs 在打包前写入） */

import { BUILD_SEMVER, BUILD_VERSION, BUILD_TIME } from 'generated/build-info'

/** 产品名称（可按部署环境覆盖） */
export const APP_PRODUCT_NAME = import.meta.env.VITE_APP_PRODUCT_NAME || translate('应急物资智能管理系统')

/**
 * 开发单位 / 版权方（产品厂商，随安装包固定）
 * 参考 Office、SAP 等：About 中 Vendor / Copyright 为产品方，非客户方
 */
export const APP_VENDOR = import.meta.env.VITE_APP_VENDOR || translate('深圳市搜牛科技有限公司')

/**
 * 授权单位回退值（客户方，运行时以 API getOrgLicensee 为准）
 * 部署时可设 VITE_APP_LICENSEE 或 API 环境变量 ORG_LICENSEE / 系统管理配置
 */
export const APP_LICENSEE_FALLBACK =
  import.meta.env.VITE_APP_LICENSEE || translate('武汉市应急物资保障中心')

export const APP_SEMVER = BUILD_SEMVER

/** 完整构建版本，如 1.0.0+202607011518 */
export const APP_VERSION = BUILD_VERSION

export const APP_BUILD_TIME = BUILD_TIME

export function formatAppVersionLabel(): string {
  if (import.meta.env.DEV || APP_VERSION.endsWith('-dev')) return `${APP_SEMVER}-dev`
  return APP_VERSION
}

export function formatCopyrightLine(year = new Date().getFullYear()): string {
  return `© ${year} ${APP_VENDOR}`
}
