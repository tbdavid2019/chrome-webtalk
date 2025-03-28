import path from 'node:path'
import { defineConfig } from 'wxt'
import react from '@vitejs/plugin-react'
import { name, displayName, homepage } from './package.json'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  srcDir: path.resolve('src'),
  imports: false,
  entrypointsDir: 'app',
  runner: {
    startUrls: ['https://david888.com/']
  },
  manifest: ({ browser }) => {
    const common = {
      name: displayName,
      permissions: ['storage', 'notifications', 'tabs'],
      homepage_url: homepage,
      icons: {
        '16': 'logo.png',
        '32': 'logo.png',
        '48': 'logo.png',
        '128': 'logo.png'
      },
      action: {}
    }
    return {
      chrome: {
        ...common
      },
      firefox: {
        ...common,
        browser_specific_settings: {
          gecko: {
            id: 'cto@david888.com'
          }
        }
      }
    }[browser]
  },

  vite: (env) => ({
    define: {
      __DEV__: env.mode === 'development',
      __NAME__: JSON.stringify(name)
    },
    plugins: [
      react(),
      svgr({
        include: '**/*.svg'
      })
    ]
  })
})