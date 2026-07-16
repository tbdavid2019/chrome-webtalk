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
  assert.match(englishGuide, /WebTalk 333 \| Website Installation Guide/)
  assert.match(englishGuide, /data-webtalk-site-id="webtalk-embed-guide"/)
})

test('embed guide presents all four chat and room-strategy combinations', () => {
  const guide = readFileSync('output/webtalk/index.html', 'utf8')

  assert.match(guide, /只有聊天 ＋ 全站共用聊天室（建議）/)
  assert.match(guide, /聊天＋AI ＋ 全站共用聊天室/)
  assert.match(guide, /只有聊天 ＋ 每頁各自聊天室/)
  assert.match(guide, /聊天＋AI ＋ 每頁各自聊天室/)
  assert.match(guide, /data-webtalk-scope="path"/)
  assert.doesNotMatch(guide, /P2P/)
  assert.doesNotMatch(guide, /your-site/)
})

test('embed guide is written for site owners installing WebTalk 333', () => {
  const guide = readFileSync('output/webtalk/index.html', 'utf8')

  assert.match(guide, /<h1>在任何網站加入 WebTalk 333<\/h1>/)
  assert.match(guide, /class="site-header"/)
  assert.match(guide, /\.site-header\s*\{\s*position: fixed/)
  assert.match(guide, /href="https:\/\/david888\.com"/)
  assert.match(guide, /data-copy-code/)
  assert.match(guide, /&lt;\/body&gt;<\/code> 前/)
  assert.match(guide, /&lt;head&gt;<\/code> 內/)
  assert.doesNotMatch(guide, /Vercel/)
  assert.doesNotMatch(guide, /WEBTALK_DOMAIN=/)
})

test('embed guide uses the default deployed domain when WEBTALK_DOMAIN is unset', () => {
  const guide = readFileSync('output/webtalk/index.html', 'utf8')
  assert.match(guide, /https:\/\/webtalk-nine\.vercel\.app\/webtalk-chat\.js/)
  assert.doesNotMatch(guide, /__WEBTALK_DOMAIN__/)
})
