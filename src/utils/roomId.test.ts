import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveRoomId, resolveRoomKey } from './roomId.ts'
import stringToHex from './stringToHex.ts'

const location = {
  origin: 'https://wiki.david888.com',
  pathname: '/share/ffrk4e',
  host: 'wiki.david888.com'
}

const documentWithMeta = {
  querySelector(selector: string) {
    assert.equal(selector, 'meta[name="webtalk-page-id" i]')
    return { getAttribute: () => 'ffrk4e' }
  }
}

test('uses the WebTalk page meta value by default', () => {
  assert.equal(resolveRoomKey({ location, document: documentWithMeta }), 'page:https://wiki.david888.com:ffrk4e')
})

test('reads page metadata from the browser document by default', () => {
  const previousDocument = (globalThis as { document?: unknown }).document
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: documentWithMeta
  })

  try {
    assert.equal(resolveRoomKey({ location }), 'page:https://wiki.david888.com:ffrk4e')
  } finally {
    if (previousDocument === undefined) {
      Reflect.deleteProperty(globalThis, 'document')
    } else {
      Object.defineProperty(globalThis, 'document', { configurable: true, value: previousDocument })
    }
  }
})

test('falls back to the site origin when page metadata is absent', () => {
  const documentWithoutMeta = { querySelector: () => null }

  assert.equal(resolveRoomKey({ location, document: documentWithoutMeta }), 'origin:https://wiki.david888.com')
})

test('supports a site-wide room explicitly', () => {
  assert.equal(
    resolveRoomKey({ scope: 'origin', location, document: documentWithMeta }),
    'origin:https://wiki.david888.com'
  )
})

test('supports path-based rooms without a trailing slash split', () => {
  assert.equal(
    resolveRoomKey({
      scope: 'path',
      location: { ...location, pathname: '/share/ffrk4e/' },
      document: documentWithMeta
    }),
    'path:https://wiki.david888.com:/share/ffrk4e'
  )
})

test('allows an embedder to override the generated room identity', () => {
  assert.equal(
    resolveRoomId({ roomId: 'david888-wiki:ffrk4e', location, document: documentWithMeta }),
    stringToHex('david888-wiki:ffrk4e')
  )
})
