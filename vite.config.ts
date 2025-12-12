import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    RubyPlugin(),
    react({
      // 開啟 Fast Refresh (HMR)
      fastRefresh: true,
    }),
  ],
})
