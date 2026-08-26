import { defineConfig } from 'vite'

export default defineConfig({
  // Don't watch the data folder — large static JSON files don't need HMR
  server: {
    watch: {
      ignored: ['**/public/data/**', '**/public/data'],
    },
  },
})
