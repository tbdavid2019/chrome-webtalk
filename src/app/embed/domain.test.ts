import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_WEBTALK_DOMAIN, resolveWebTalkDomain } from './domain.ts'

test('uses the deployed WebTalk domain by default', () => {
  assert.equal(resolveWebTalkDomain(), DEFAULT_WEBTALK_DOMAIN)
})

test('uses WEBTALK_DOMAIN and removes its trailing slash', () => {
  assert.equal(resolveWebTalkDomain('https://custom-webtalk.example/'), 'https://custom-webtalk.example')
})
