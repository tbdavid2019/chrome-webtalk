import test from 'node:test'
import assert from 'node:assert/strict'
import { createRoomStorageKey } from './roomStorageKey.ts'

test('keeps message history isolated by room id', () => {
  const baseKey = 'WEB_TALK_MESSAGE_LIST'
  const wikiPageA = createRoomStorageKey(baseKey, 'page-wiki-a')
  const wikiPageB = createRoomStorageKey(baseKey, 'page-wiki-b')

  assert.equal(wikiPageA, 'WEB_TALK_MESSAGE_LIST:page-wiki-a')
  assert.equal(wikiPageB, 'WEB_TALK_MESSAGE_LIST:page-wiki-b')
  assert.notEqual(wikiPageA, wikiPageB)
})
