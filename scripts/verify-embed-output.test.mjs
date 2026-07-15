import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

test('embed build emits chat and hybrid bundles', () => {
  assert.equal(existsSync('output/webtalk/webtalk-chat.js'), true)
  assert.equal(existsSync('output/webtalk/webtalk.js'), true)
})

test('embed build emits the Chinese integration guide', () => {
  assert.equal(existsSync('output/webtalk/index.html'), true)
})
