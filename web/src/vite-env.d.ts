/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_VENDOR: string
  readonly VITE_APP_LICENSEE: string
  readonly VITE_APP_PRODUCT_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
