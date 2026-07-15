import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

test('embed build emits chat and hybrid bundles', () => {
  assert.equal(existsSync('output/webtalk/webtalk-chat.js'), true)
  assert.equal(existsSync('output/webtalk/webtalk.js'), true)
})

test('embed build emits a bilingual integration guide', () => {
  assert.equal(existsSync('output/webtalk/index.html'), true)

  const guide = readFileSync('output/webtalk/index.html', 'utf8')
  assert.match(guide, /data-language-switch/)
  assert.match(guide, /href="\.\/en\.html"/)
  assert.match(guide, /data-webtalk-site-id="webtalk-embed-guide"/)
  assert.equal(existsSync('output/webtalk/en.html'), true)
  const englishGuide = readFileSync('output/webtalk/en.html', 'utf8')
  assert.match(englishGuide, /WebTalk Embed Guide/)
  assert.match(englishGuide, /data-webtalk-site-id="webtalk-embed-guide"/)
})

test('embed guide uses the default deployed domain when WEBTALK_DOMAIN is unset', () => {
  const guide = readFileSync('output/webtalk/index.html', 'utf8')
  assert.match(guide, /https:\/\/webtalk-nine\.vercel\.app\/webtalk-chat\.js/)
  assert.doesNotMatch(guide, /__WEBTALK_DOMAIN__/)
})
