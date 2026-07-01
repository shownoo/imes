import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve(__dirname, 'src')
const ASSETS_DIR = 'imesassetsv2'

function readAssetRelease(): string {
  const metaPath = path.resolve(SRC_DIR, 'generated/build-meta.json')
  if (!existsSync(metaPath)) return 'dev'
  try {
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as { assetRelease?: string }
    return meta.assetRelease ?? 'dev'
  } catch {
    return 'dev'
  }
}

/** 对齐 tsconfig baseUrl: "./src" 的裸模块解析 */
function baseUrlPlugin(): Plugin {
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json']

  function resolveFromSrc(source: string): string | null {
    const base = path.resolve(SRC_DIR, source)
    for (const ext of ['', ...exts]) {
      const file = base + ext
      if (existsSync(file) && statSync(file).isFile()) return file
    }
    for (const ext of exts) {
      const file = path.join(base, `index${ext}`)
      if (existsSync(file)) return file
    }
    return null
  }

  return {
    name: 'imes-base-url',
    resolveId(source) {
      if (source.startsWith('.') || source.startsWith('/') || source.includes('\0')) return null
      if (source.startsWith('@') || source.includes('node_modules')) return null
      return resolveFromSrc(source)
    },
  }
}

const release = readAssetRelease()

export default defineConfig({
  plugins: [react(), baseUrlPlugin()],
  server: {
    port: 5174,
    proxy: {
      '/graphql': {
        target: 'http://localhost:3200',
        ws: true,
      },
      '/files': 'http://localhost:3200',
    },
  },
  build: {
    assetsDir: ASSETS_DIR,
    rollupOptions: {
      output: {
        chunkFileNames: `${ASSETS_DIR}/${release}/js/[name].[hash].js`,
        entryFileNames: `${ASSETS_DIR}/${release}/js/[name].[hash].js`,
        assetFileNames: (chunkInfo) => {
          let subDir = 'images'
          if (chunkInfo.name && path.extname(chunkInfo.name) === '.css') {
            subDir = `${release}/css`
          }
          return `${ASSETS_DIR}/${subDir}/[name].[hash].[ext]`
        },
      },
    },
  },
})
