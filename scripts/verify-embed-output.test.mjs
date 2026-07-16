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

  assert.match(guide, /只有聊天 ＋ 全站共用聊天室/)
  assert.match(guide, /聊天＋AI ＋ 全站共用聊天室（建議）/)
  assert.match(guide, /只有聊天 ＋ 每頁各自聊天室/)
  assert.match(guide, /聊天＋AI ＋ 每頁各自聊天室/)
  assert.match(guide, /適合哪些站長使用？/)
  assert.match(guide, /企業後台與會員系統/)
  assert.match(guide, /目前版本不是客服工具/)
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

test('embed guide publishes complete social and install metadata', () => {
  const guide = readFileSync('output/webtalk/index.html', 'utf8')
  const favicon = readFileSync('output/webtalk/favicon.svg', 'utf8')

  assert.match(guide, /name="description"/)
  assert.match(guide, /property="og:description"/)
  assert.match(guide, /property="og:image" content="https:\/\/webtalk-nine\.vercel\.app\/og-image\.png"/)
  assert.match(guide, /property="og:url" content="https:\/\/webtalk-nine\.vercel\.app\/"/)
  assert.match(guide, /name="twitter:card" content="summary_large_image"/)
  assert.match(guide, /name="twitter:site" content="@David888111888"/)
  assert.match(guide, /rel="canonical" href="https:\/\/webtalk-nine\.vercel\.app\/"/)
  assert.match(guide, /rel="apple-touch-icon"/)
  assert.match(guide, /rel="manifest" href="\/site\.webmanifest"/)
  assert.match(guide, /application\/ld\+json/)
  assert.match(favicon, /💬/)
  assert.equal(existsSync('output/webtalk/og-image.png'), true)
  assert.equal(existsSync('output/webtalk/favicon-32x32.png'), true)
  assert.equal(existsSync('output/webtalk/site.webmanifest'), true)
})
