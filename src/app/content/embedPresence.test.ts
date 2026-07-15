import assert from 'node:assert/strict'
import test from 'node:test'

import { hasWebTalkEmbed } from './embedPresence.ts'

test('recognizes the official WebTalk embed host element', () => {
  assert.equal(hasWebTalkEmbed({ querySelector: () => ({}) }), true)
})

test('does not report an embed when its host element is absent', () => {
  assert.equal(hasWebTalkEmbed({ querySelector: () => null }), false)
})
