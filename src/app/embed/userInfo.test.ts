import assert from 'node:assert/strict'
import test from 'node:test'

import { createRandomEmbedUserInfo, shouldAutoCreateEmbedUserInfo } from './userInfo.ts'

test('auto-creates an embed user only after embed storage has loaded', () => {
  assert.equal(shouldAutoCreateEmbedUserInfo({ isEmbed: true, userInfoLoadFinished: true, userInfo: null }), true)
  assert.equal(shouldAutoCreateEmbedUserInfo({ isEmbed: false, userInfoLoadFinished: true, userInfo: null }), false)
  assert.equal(shouldAutoCreateEmbedUserInfo({ isEmbed: true, userInfoLoadFinished: false, userInfo: null }), false)
  assert.equal(
    shouldAutoCreateEmbedUserInfo({
      isEmbed: true,
      userInfoLoadFinished: true,
      userInfo: { id: 'existing-user' }
    }),
    false
  )
})

test('creates a ready-to-chat embed user with a random display name', async () => {
  const userInfo = await createRandomEmbedUserInfo()

  assert.match(userInfo.name, /^[A-Za-z]+ [A-Za-z]+ [A-Za-z0-9_-]{3}$/)
  assert.notEqual(userInfo.id, '')
  assert.match(userInfo.avatar, /^data:image\/svg\+xml;base64,/)
  assert.equal(userInfo.compatibilityMode, 'legacy')
  assert.equal(userInfo.themeMode, 'system')
})
