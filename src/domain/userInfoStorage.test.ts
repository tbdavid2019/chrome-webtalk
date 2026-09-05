import assert from 'node:assert/strict'
import test from 'node:test'

import type { UserInfo } from './UserInfo.ts'
import { mergeUserInfoStorage, splitUserInfoStorage } from './userInfoStorage.ts'

const userInfo: UserInfo = {
  id: 'user-1',
  name: 'David',
  avatar: 'data:image/webp;base64,avatar',
  createTime: 1,
  language: 'zh_TW',
  themeMode: 'dark',
  danmakuEnabled: true,
  notificationEnabled: true,
  notificationType: 'at',
  globalAvatar: 'data:image/webp;base64,global',
  roomAvatars: { 'example.com': 'data:image/webp;base64,room' }
}

test('splits avatar payload out of the sync user info value', () => {
  const parts = splitUserInfoStorage(userInfo)

  assert.deepEqual(parts.sync, {
    id: 'user-1',
    name: 'David',
    createTime: 1,
    language: 'zh_TW',
    themeMode: 'dark',
    danmakuEnabled: true,
    notificationEnabled: true,
    notificationType: 'at'
  })
  assert.deepEqual(parts.local, {
    avatar: userInfo.avatar,
    globalAvatar: userInfo.globalAvatar,
    roomAvatars: userInfo.roomAvatars
  })
})

test('merges local avatar data with sync settings', () => {
  const parts = splitUserInfoStorage(userInfo)

  assert.deepEqual(mergeUserInfoStorage(parts.sync, parts.local), userInfo)
})

test('reads legacy avatar fields from the sync value during migration', () => {
  const { avatar, globalAvatar, roomAvatars, ...legacySync } = userInfo

  assert.deepEqual(mergeUserInfoStorage({ ...legacySync, avatar, globalAvatar, roomAvatars }, null), userInfo)
})

test('preserves floatingButtonPlacement in sync settings', () => {
  const customUserInfo: UserInfo = {
    ...userInfo,
    floatingButtonPlacement: 'left'
  }
  const parts = splitUserInfoStorage(customUserInfo)

  assert.equal(parts.sync.floatingButtonPlacement, 'left')
  assert.deepEqual(mergeUserInfoStorage(parts.sync, parts.local), customUserInfo)
})
