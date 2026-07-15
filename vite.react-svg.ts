import fs from 'node:fs/promises'
import { transform } from '@svgr/core'
import jsx from '@svgr/plugin-jsx'
import { transformWithEsbuild, type Plugin } from 'vite'

const SVG_FILE_PATTERN = /\.svg(?:[?#].*)?$/
const SVG_QUERY_PATTERN = /[?#].*$/s

export const reactSvg = (): Plugin => ({
  name: 'webtalk-react-svg',
  enforce: 'pre',
  async load(id) {
    if (!SVG_FILE_PATTERN.test(id)) return null

    const filePath = id.replace(SVG_QUERY_PATTERN, '')
    const svgCode = await fs.readFile(filePath, 'utf8')
    const componentCode = await transform(svgCode, {}, { filePath, caller: { defaultPlugins: [jsx] } })
    const result = await transformWithEsbuild(componentCode, id, { loader: 'jsx' })

    return { code: result.code, map: null }
  }
})
