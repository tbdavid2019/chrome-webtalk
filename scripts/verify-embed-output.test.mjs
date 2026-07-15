import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

test('embed build emits chat and hybrid bundles', () => {
  assert.equal(existsSync('output/webtalk/webtalk-chat.js'), true)
  assert.equal(existsSync('output/webtalk/webtalk.js'), true)
})

test('embed build emits the Chinese integration guide', () => {
  assert.equal(existsSync('output/webtalk/index.html'), true)
})

test('embed guide uses the default deployed domain when WEBTALK_DOMAIN is unset', () => {
  const guide = readFileSync('output/webtalk/index.html', 'utf8')
  assert.match(guide, /https:\/\/webtalk-nine\.vercel\.app\/webtalk-chat\.js/)
  assert.doesNotMatch(guide, /__WEBTALK_DOMAIN__/)
})
