import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enUSTranslation from './en_US.json'
import zhCNTranslation from './zh_CN.json'

export enum LanguageType {
  ZH_CN = 'zh-CN',
  EN_US = 'en-US',
}

export const LANGUAGE_OPTIONS = [
  { value: LanguageType.ZH_CN, labelKey: '简体中文' },
  { value: LanguageType.EN_US, labelKey: 'English' },
] as const

export const resources = {
  [LanguageType.ZH_CN]: { translation: zhCNTranslation },
  [LanguageType.EN_US]: { translation: enUSTranslation },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: LanguageType.ZH_CN,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

export function translate(zh: string): string {
  return i18n.t(zh, { defaultValue: zh })
}

export default i18n
