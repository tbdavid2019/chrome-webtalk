import { createAvatar, type Style } from '@dicebear/core'
import { create as createLorelei, meta as metaLorelei, schema as schemaLorelei } from '@dicebear/lorelei'
import { create as createLoreleiNeutral, meta as metaLoreleiNeutral, schema as schemaLoreleiNeutral } from '@dicebear/lorelei-neutral'
import { create as createBigEarsNeutral, meta as metaBigEarsNeutral, schema as schemaBigEarsNeutral } from '@dicebear/big-ears-neutral'
import { create as createAdventurerNeutral, meta as metaAdventurerNeutral, schema as schemaAdventurerNeutral } from '@dicebear/adventurer-neutral'
import { create as createBigSmile, meta as metaBigSmile, schema as schemaBigSmile } from '@dicebear/big-smile'
import { create as createPixelArt, meta as metaPixelArt, schema as schemaPixelArt } from '@dicebear/pixel-art'
import { create as createNotionists, meta as metaNotionists, schema as schemaNotionists } from '@dicebear/notionists'

const STYLES: Style<any>[] = [
  { create: createLorelei, meta: metaLorelei, schema: schemaLorelei },
  { create: createLoreleiNeutral, meta: metaLoreleiNeutral, schema: schemaLoreleiNeutral },
  { create: createBigEarsNeutral, meta: metaBigEarsNeutral, schema: schemaBigEarsNeutral },
  { create: createAdventurerNeutral, meta: metaAdventurerNeutral, schema: schemaAdventurerNeutral },
  { create: createBigSmile, meta: metaBigSmile, schema: schemaBigSmile },
  { create: createPixelArt, meta: metaPixelArt, schema: schemaPixelArt },
  { create: createNotionists, meta: metaNotionists, schema: schemaNotionists }
]

const generateRandomAvatar = async (_targetSize: number) => {
  const seed = Math.random().toString(36).substring(7)
  const style = STYLES[Math.floor(Math.random() * STYLES.length)]

  const avatar = createAvatar(style, {
    seed,
    size: 128
  })

  const svg = avatar.toString()
  const base64 = btoa(unescape(encodeURIComponent(svg)))
  return `data:image/svg+xml;base64,${base64}`
}

export default generateRandomAvatar
