import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5174,
    proxy: {
      '/graphql': 'http://localhost:3200',
      '/files': 'http://localhost:3200',
    },
  },
})
